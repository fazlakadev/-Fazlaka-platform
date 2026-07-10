// lib/redis.ts
// Upstash Redis (serverless, Edge-compatible) client singleton.
// Used as the fast in-memory layer for session revocation checks, touch
// throttling, and caching — backed by the persistent Prisma DB.

import { Redis } from "@upstash/redis"

const globalForRedis = globalThis as unknown as { __upstashRedis?: Redis }

export const redis: Redis =
  globalForRedis.__upstashRedis ??
  new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL ?? "",
    token: process.env.UPSTASH_REDIS_REST_TOKEN ?? "",
  })

if (process.env.NODE_ENV !== "production") {
  globalForRedis.__upstashRedis = redis
}

// ---- Keyspace helpers ----

const PREFIX = "sessions:"
const REVOKED_SET = `${PREFIX}revoked`   // Set of revoked JTIs
const TOUCH_PREFIX = `${PREFIX}touch:`    // Per-JTI last-touch timestamp
const TOUCH_TTL = 5 * 60                 // 5 minutes

/**
 * Check if a JWT `jti` has been revoked. Uses a Redis Set for O(1) lookup.
 */
export async function isRevokedJti(jti: string): Promise<boolean> {
  if (!jti) return false
  try {
    const score = await redis.zscore(REVOKED_SET, jti)
    return score !== null
  } catch {
    // Redis unavailable — fail open.
    return false
  }
}

/**
 * Add a JTI to the revoked set (score = revoked-at epoch ms).
 */
export async function addRevokedJti(jti: string): Promise<void> {
  try {
    await redis.zadd(REVOKED_SET, { score: Date.now(), member: jti })
  } catch (err) {
    console.error("[redis] addRevokedJti failed:", err)
  }
}

/**
 * Bulk-revoke JTIs — used by "sign out everywhere".
 */
export async function addRevokedJtis(jtis: string[]): Promise<void> {
  if (!jtis.length) return
  try {
    const now = Date.now()
    // Upstash zadd: redis.zadd(key, ...{score, member}[])
    const args = jtis.map((j) => ({ score: now, member: j }))
    // @ts-expect-error — Upstash spread overloads need type assertion for bulk ops
    await redis.zadd(REVOKED_SET, ...args)
  } catch (err) {
    console.error("[redis] addRevokedJtis failed:", err)
  }
}

/**
 * Throttled touch: store a "last active" timestamp per JTI in Redis.
 * Returns `true` if the touch was actually written (not throttled).
 */
export async function touchJti(jti: string): Promise<boolean> {
  if (!jti) return false
  const key = `${TOUCH_PREFIX}${jti}`
  const now = Date.now()
  try {
    // SET NX = only write if key doesn't exist; EX = TTL in seconds.
    const wasSet = await redis.set(key, String(now), { ex: TOUCH_TTL, nx: true })
    if (wasSet === "OK") return true
    return false
  } catch {
    return false
  }
}

/**
 * Remove a JTI from the revoked set (e.g. on re-login after prior revocation).
 */
export async function unrevokedJti(jti: string): Promise<void> {
  try {
    await redis.zrem(REVOKED_SET, jti)
  } catch (err) {
    console.error("[redis] unrevokedJti failed:", err)
  }
}

/**
 * Get all revoked JTIs (for debugging/admin). Returns array of strings.
 */
export async function getAllRevokedJtis(): Promise<string[]> {
  try {
    return await redis.zrange(REVOKED_SET, 0, -1)
  } catch {
    return []
  }
}

/**
 * Bulk-remove multiple JTIs from the revoked set (e.g. cleanup).
 */
export async function removeRevokedJtis(jtis: string[]): Promise<void> {
  if (!jtis.length) return
  try {
    await redis.zrem(REVOKED_SET, ...jtis)
  } catch (err) {
    console.error("[redis] removeRevokedJtis failed:", err)
  }
}
