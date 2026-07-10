import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"
import { parseUserAgent, getClientIp } from "@/lib/user-agent"
import { touchSession, revokeAllOtherSessions, cleanupStaleSessions, type PublicSession } from "@/lib/sessions"
import { getGeoFromIp } from "@/lib/geo"

const SESSION_MAX_AGE_DAYS = 30

export async function GET(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (!token?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = token.sub as string
  const jti = (token.jti as string | undefined) ?? null
  const ua = request.headers.get("user-agent") ?? null
  const ip = getClientIp(request.headers)
  const parsed = ua ? parseUserAgent(ua) : null

  // Resolve the session row for this request.
  // 1) Try to find by JTI (fast path)
  // 2) If not found, find by fingerprint (userId + IP + UA) and update its JTI
  // 3) Only as a last resort, create a brand-new row.
  let currentSessionId: string | null = null

  const deviceData = parsed
    ? {
        ip: ip ?? undefined,
        userAgent: ua ?? undefined,
        device: parsed.device === "Unknown" ? null : parsed.device,
        deviceType: parsed.deviceType === "unknown" ? null : parsed.deviceType,
        browser: parsed.browser === "Unknown" ? null : parsed.browser,
        browserVersion: parsed.browserVersion ?? null,
        os: parsed.os === "Unknown" ? null : parsed.os,
        osVersion: parsed.osVersion ?? null,
      }
    : {}

  if (jti) {
    try {
      const existing = await prisma.userSession.findUnique({
        where: { jti },
        select: { id: true, device: true },
      })

      if (existing) {
        currentSessionId = existing.id
        if (parsed && !existing.device) {
          await prisma.userSession.update({ where: { id: existing.id }, data: deviceData })
        }
        touchSession(jti).catch(() => {})
      } else {
        // JTI not found — try to adopt an existing session by fingerprint
        const fingerprintMatch = await prisma.userSession.findFirst({
          where: {
            userId,
            isRevoked: false,
            ip: ip ?? undefined,
            userAgent: ua ?? undefined,
          },
          select: { id: true },
          orderBy: { lastActive: "desc" },
        })

        if (fingerprintMatch) {
          // Adopt: update JTI + device info on the existing row
          const now = new Date()
          await prisma.userSession.update({
            where: { id: fingerprintMatch.id },
            data: {
              jti,
              ...deviceData,
              lastActive: now,
              expiresAt: new Date(now.getTime() + SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000),
            },
          })
          currentSessionId = fingerprintMatch.id
        } else {
          // Truly new device — create a row
          const now = new Date()
          const created = await prisma.userSession.create({
            data: {
              userId,
              jti,
              ip: ip ?? null,
              userAgent: ua ?? null,
              device: parsed?.device === "Unknown" ? null : (parsed?.device ?? null),
              deviceType: parsed?.deviceType === "unknown" ? null : (parsed?.deviceType ?? null),
              browser: parsed?.browser === "Unknown" ? null : (parsed?.browser ?? null),
              browserVersion: parsed?.browserVersion ?? null,
              os: parsed?.os === "Unknown" ? null : (parsed?.os ?? null),
              osVersion: parsed?.osVersion ?? null,
              lastActive: now,
              expiresAt: new Date(now.getTime() + SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000),
            },
          })
          currentSessionId = created.id
        }
      }
    } catch (err) {
      console.error("[sessions] resolve current error:", err)
    }
  }

  // Clean up stale sessions (old sessions with no device info from before the fix)
  await cleanupStaleSessions(userId, jti).catch(() => {})

  // Also revoke orphaned duplicates: other active sessions from the same IP+UA
  // that belong to this user (leftover from JTI mismatch issues).
  if (jti && ip && ua) {
    await prisma.userSession
      .updateMany({
        where: {
          userId,
          isRevoked: false,
          NOT: { jti },
          ip,
          userAgent: ua,
        },
        data: { isRevoked: true, revokedAt: new Date() },
      })
      .catch(() => {})
  }

  // Fetch all active sessions
  const now = new Date()
  const rows = await prisma.userSession.findMany({
    where: {
      userId,
      isRevoked: false,
      expiresAt: { gt: now },
    },
    orderBy: { lastActive: "desc" },
  })

  // Collect unique IPs for geo lookup (include current request IP too)
  const allIps = new Set(rows.map((r) => r.ip).filter(Boolean) as string[])
  if (ip) allIps.add(ip)
  const uniqueIps = [...allIps]
  const geoMap = new Map<string, { country: string; city: string; flag: string; lat: number; lng: number } | null>()
  await Promise.all(
    uniqueIps.map(async (geoIp) => {
      const geo = await getGeoFromIp(geoIp)
      geoMap.set(geoIp, geo)
    }),
  )

  const sessions: (PublicSession & { isCurrent: boolean })[] = rows.map((r) => {
    const isCurrent = currentSessionId ? r.id === currentSessionId : false
    const pub: PublicSession & { isCurrent: boolean } = {
      id: r.id,
      jti: r.jti,
      ip: r.ip,
      device: r.device,
      deviceType: r.deviceType,
      browser: r.browser,
      browserVersion: r.browserVersion,
      os: r.os,
      osVersion: r.osVersion,
      location: (r.ip ? geoMap.get(r.ip) ?? null : null) as { country: string; city: string; flag: string; lat: number; lng: number } | null,
      createdAt: r.createdAt.toISOString(),
      lastActive: r.lastActive.toISOString(),
      expiresAt: r.expiresAt.toISOString(),
      isRevoked: r.isRevoked,
      isCurrent,
    }

    // In-memory enrichment for the current session
    if (isCurrent && parsed) {
      pub.ip = pub.ip ?? ip
      pub.device = pub.device ?? (parsed.device === "Unknown" ? null : parsed.device)
      pub.deviceType = pub.deviceType ?? (parsed.deviceType === "unknown" ? null : parsed.deviceType)
      pub.browser = pub.browser ?? (parsed.browser === "Unknown" ? null : parsed.browser)
      pub.browserVersion = pub.browserVersion ?? parsed.browserVersion ?? null
      pub.os = pub.os ?? (parsed.os === "Unknown" ? null : parsed.os)
      pub.osVersion = pub.osVersion ?? parsed.osVersion ?? null
      // Geo enrichment for current session
      if (!pub.location && ip) {
        pub.location = geoMap.get(ip) ?? null
      }
    }

    return pub
  })

  return NextResponse.json({ sessions })
}

export async function DELETE(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (!token?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = token.sub as string
  const jti = (token.jti as string | undefined) ?? null

  if (!jti) {
    return NextResponse.json(
      { error: "Cannot revoke: no session fingerprint" },
      { status: 400 },
    )
  }

  const revokedCount = await revokeAllOtherSessions(userId, jti)

  return NextResponse.json({
    success: true,
    revokedCount,
    message: `Revoked ${revokedCount} session(s)`,
  })
}
