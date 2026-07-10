// lib/sessions.ts
// Tracks active logins per user/device and enforces JWT revocation via Redis.
//
// Architecture:
//   Redis (fast path)  →  Prisma DB (persistent source of truth)
//
// - Each login stores a `UserSession` row in PostgreSQL linked to the NextAuth
//   JWT `jti`. The same JTI is added to a Redis sorted set for O(1) revocation
//   checks on every authenticated request.
// - Revoking a session writes `isRevoked=true` to the DB and adds the jti to the
//   Redis set. Subsequent requests with that JWT are rejected at the auth layer.
// - "Last active" touches are throttled via Redis TTL keys to avoid DB churn.

import { prisma } from "@/lib/prisma"
import { parseUserAgent } from "@/lib/user-agent"
import {
  isRevokedJti as redisIsRevokedJti,
  addRevokedJti as redisAddRevokedJti,
  addRevokedJtis as redisAddRevokedJtis,
  touchJti as redisTouchJti,
  unrevokedJti as redisUnrevokedJti,
} from "@/lib/redis"

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface PublicSession {
  id: string
  jti: string
  ip: string | null
  device: string | null
  deviceType: string | null
  browser: string | null
  browserVersion: string | null
  os: string | null
  osVersion: string | null
  location: { country: string; city: string; region: string; flag: string; lat: number; lng: number; postal: string; isp: string; org: string; timezone: string; continent: string } | null
  createdAt: string
  lastActive: string
  expiresAt: string
  isRevoked: boolean
}

function toPublicSession(s: {
  id: string
  jti: string
  ip: string | null
  device: string | null
  deviceType: string | null
  browser: string | null
  browserVersion: string | null
  os: string | null
  osVersion: string | null
  createdAt: Date
  lastActive: Date
  expiresAt: Date
  isRevoked: boolean
}): PublicSession {
  return {
    id: s.id,
    jti: s.jti,
    ip: s.ip,
    device: s.device,
    deviceType: s.deviceType,
    browser: s.browser,
    browserVersion: s.browserVersion,
    os: s.os,
    osVersion: s.osVersion,
    location: null,
    createdAt: s.createdAt.toISOString(),
    lastActive: s.lastActive.toISOString(),
    expiresAt: s.expiresAt.toISOString(),
    isRevoked: s.isRevoked,
  }
}

// ─────────────────────────────────────────────
// Create / Resume tracked sessions
// ─────────────────────────────────────────────

const SESSION_MAX_AGE_DAYS = 30

export interface CreateSessionInput {
  userId: string
  jti: string
  userAgent?: string | null
  ip?: string | null
  expiresAt?: Date
}

// Upsert a tracked session row on login. Called from NextAuth `signIn` event
// and can be called from other auth flows (magic link, desktop exchange, etc.).
export async function createTrackedSession(input: CreateSessionInput): Promise<void> {
  const ua = parseUserAgent(input.userAgent ?? null)
  const now = new Date()
  const expiresAt =
    input.expiresAt ?? new Date(now.getTime() + SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000)

  try {
    const existing = await prisma.userSession.findUnique({
      where: { jti: input.jti },
      select: { id: true, isRevoked: true },
    })

    if (!existing) {
      await prisma.userSession.create({
        data: {
          userId: input.userId,
          jti: input.jti,
          ip: input.ip ?? null,
          userAgent: input.userAgent ?? null,
          device: ua.device === "Unknown" ? null : ua.device,
          deviceType: ua.deviceType === "unknown" ? null : ua.deviceType,
          browser: ua.browser === "Unknown" ? null : ua.browser,
          browserVersion: ua.browserVersion ?? null,
          os: ua.os === "Unknown" ? null : ua.os,
          osVersion: ua.osVersion ?? null,
          lastActive: now,
          expiresAt,
        },
      })
    } else if (existing.isRevoked) {
      await prisma.userSession.update({
        where: { id: existing.id },
        data: { isRevoked: false, revokedAt: null, lastActive: now, expiresAt },
      })
      // Remove from Redis revoked set
      await redisUnrevokedJti(input.jti)
    } else {
      await prisma.userSession.update({
        where: { id: existing.id },
        data: { lastActive: now },
      })
    }
  } catch (err) {
    console.error("[sessions] createTrackedSession error:", err)
  }
}

// ─────────────────────────────────────────────
// Enrich device info lazily (called on first
// authenticated request that carries UA/IP)
// ─────────────────────────────────────────────

export async function enrichSessionInfo(
  jti: string,
  userAgent: string | null,
  ip: string | null,
): Promise<void> {
  if (!jti) return
  try {
    const ua = parseUserAgent(userAgent)
    await prisma.userSession.updateMany({
      where: {
        jti,
        isRevoked: false,
      },
      data: {
        ip: ip ?? undefined,
        userAgent: userAgent ?? undefined,
        device: ua.device === "Unknown" ? null : ua.device,
        deviceType: ua.deviceType === "unknown" ? null : ua.deviceType,
        browser: ua.browser === "Unknown" ? null : ua.browser,
        browserVersion: ua.browserVersion ?? null,
        os: ua.os === "Unknown" ? null : ua.os,
        osVersion: ua.osVersion ?? null,
        lastActive: new Date(),
      },
    })
  } catch (err) {
    console.error("[sessions] enrichSessionInfo error:", err)
  }
}

// ─────────────────────────────────────────────
// List active sessions
// ─────────────────────────────────────────────

export async function listActiveSessions(userId: string): Promise<PublicSession[]> {
  const now = new Date()
  const rows = await prisma.userSession.findMany({
    where: {
      userId,
      isRevoked: false,
      expiresAt: { gt: now },
    },
    orderBy: { lastActive: "desc" },
  })
  return rows.map(toPublicSession)
}

// ─────────────────────────────────────────────
// Throttled "last active" touch
// ─────────────────────────────────────────────

// First try Redis (fast, non-blocking). On hit, the touch was already written;
// on miss we fall through to a DB write at most once per 5 min.
const DB_TOUCH_TTL_MS = 5 * 60 * 1000
const lastDbTouchByJti = new Map<string, number>()

export async function touchSession(jti: string): Promise<void> {
  if (!jti) return

  // Fast path: Redis NX key with 5-min TTL
  const redisWritten = await redisTouchJti(jti)

  if (!redisWritten) {
    // Redis already had a recent touch — skip DB too
    return
  }

  // Slow path: throttle DB writes independently
  const now = Date.now()
  const last = lastDbTouchByJti.get(jti) ?? 0
  if (now - last < DB_TOUCH_TTL_MS) return
  lastDbTouchByJti.set(jti, now)

  try {
    await prisma.userSession.updateMany({
      where: { jti, isRevoked: false },
      data: { lastActive: new Date() },
    })
  } catch {
    // Non-critical
  }
}

// ─────────────────────────────────────────────
// Revoke operations
// ─────────────────────────────────────────────

// Revoke a single session by ID (UI delete button).
export async function revokeSession(
  userId: string,
  sessionId: string,
): Promise<{ success: boolean; jti?: string }> {
  const row = await prisma.userSession.findFirst({
    where: { id: sessionId, userId },
    select: { id: true, jti: true },
  })
  if (!row) return { success: false }

  const now = new Date()
  await prisma.userSession.update({
    where: { id: row.id },
    data: { isRevoked: true, revokedAt: now },
  })

  // Also remove from Redis revoked set — we're ADDING it now
  await redisAddRevokedJti(row.jti)

  return { success: true, jti: row.jti }
}

// Revoke all sessions for a user EXCEPT the supplied currentJti.
export async function revokeAllOtherSessions(
  userId: string,
  currentJti: string,
): Promise<number> {
  const now = new Date()

  const rows = await prisma.userSession.findMany({
    where: {
      userId,
      isRevoked: false,
      NOT: { jti: currentJti },
    },
    select: { id: true, jti: true },
  })

  if (!rows.length) return 0

  await prisma.userSession.updateMany({
    where: {
      userId,
      isRevoked: false,
      NOT: { jti: currentJti },
    },
    data: { isRevoked: true, revokedAt: now },
  })

  // Bulk-add all revoked JTIs to Redis
  await redisAddRevokedJtis(rows.map((r) => r.jti))

  return rows.length
}

// ─────────────────────────────────────────────
// Revocation enforcement (called from
// auth-helper.ts on every authenticated request)
// ─────────────────────────────────────────────

export async function isJtiRevoked(jti: string): Promise<boolean> {
  if (!jti) return false

  // Fast path: Redis sorted-set lookup (O(log n), ~1ms)
  const revokedInRedis = await redisIsRevokedJti(jti)
  if (revokedInRedis) return true

  // Slow path: DB fallback (if Redis is unavailable or stale)
  try {
    const row = await prisma.userSession.findUnique({
      where: { jti },
      select: { isRevoked: true, expiresAt: true },
    })
    if (!row) return false
    if (row.isRevoked || row.expiresAt.getTime() < Date.now()) return true
  } catch {
    // Fail open
  }

  return false
}

export async function revokeSessionByJti(jti: string): Promise<void> {
  if (!jti) return
  try {
    await prisma.userSession.updateMany({
      where: { jti, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date() },
    })
    await redisAddRevokedJti(jti)
  } catch (err) {
    console.error("[sessions] revokeSessionByJti error:", err)
  }
}

export async function cleanupStaleSessions(
  userId: string,
  currentJti: string | null,
): Promise<void> {
  try {
    const where: Parameters<typeof prisma.userSession.updateMany>[0]["where"] = {
      userId,
      isRevoked: false,
      device: null,
      userAgent: null,
    }
    if (currentJti) {
      where.NOT = { jti: currentJti }
    }
    await prisma.userSession.updateMany({
      where,
      data: { isRevoked: true, revokedAt: new Date() },
    })
  } catch {
    // Non-critical
  }
}

export { toPublicSession }
