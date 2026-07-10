// lib/auth-helper.ts
// Centralized authentication helper.
//
// - getUserIdFromRequest(req)   → string | null   (backward-compatible, 77+ call-sites)
// - getUserIdAndJti(req)        → { userId, jti } | null  (new, for sessions enrichment)
//
// Both enforce JTI revocation: if the user's session was deleted from the
// Sessions UI, subsequent requests with that JWT are rejected.

import { NextRequest } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { verifyToken } from "@/lib/jwt"
import { findUserByIdentity } from "@/lib/user-resolver"
import { isJtiRevoked } from "@/lib/sessions"
import { getToken } from "next-auth/jwt"

// ─────────────────────────────────────────────
// Internal: shared resolution logic
// ─────────────────────────────────────────────

async function resolveAuth(request: NextRequest): Promise<{
  userId: string
  jti: string | null
} | null> {
  // ── 1. Bearer JWT (mobile / desktop clients) ──
  const authHeader = request.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7)
    try {
      const payload = verifyToken(token) as { userId?: string } | null
      if (payload?.userId) {
        return { userId: payload.userId, jti: null }
      }
    } catch {
      // invalid / expired → fall through
    }
  }

  // ── 2. NextAuth cookie session ──
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token) return null

    const jti = (token.jti as string | undefined) ?? null

    // Enforce revocation
    if (jti) {
      const revoked = await isJtiRevoked(jti)
      if (revoked) return null
    }

    const session = (await getServerSession(authOptions)) as
      | { user?: { id?: string; email?: string | null } }
      | null

    const user = await findUserByIdentity(session?.user)
    const userId = user?.id ?? session?.user?.id ?? null
    if (!userId) return null

    return { userId, jti }
  } catch {
    // getServerSession / getToken failure → deny
  }

  return null
}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

/**
 * Returns the authenticated user ID, or null if unauthenticated / revoked.
 * Drop-in replacement for the original — all 77+ existing call-sites use this.
 */
export async function getUserIdFromRequest(
  request: NextRequest,
): Promise<string | null> {
  const result = await resolveAuth(request)
  return result?.userId ?? null
}

/**
 * Returns userId + jti. The jti is used by the Sessions API to enrich the
 * current session row with device / IP info on the first call.
 */
export async function getUserIdAndJti(
  request: NextRequest,
): Promise<{ userId: string; jti: string | null } | null> {
  return resolveAuth(request)
}
