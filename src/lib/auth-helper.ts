import { NextRequest } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { verifyToken } from "@/lib/jwt"

export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  // Try JWT Bearer token first (for mobile app / API calls)
  const authHeader = request.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7)
    try {
      const payload = verifyToken(token)
      if (payload?.userId) {
        return payload.userId
      }
      console.error("[getUserIdFromRequest] JWT verification returned null payload", token.slice(0, 20) + "...")
    } catch (e) {
      console.error("[getUserIdFromRequest] JWT verification threw:", e)
    }
  } else {
    console.error("[getUserIdFromRequest] No Authorization header or not Bearer")
    // Log all headers for debugging
    const allHeaders: Record<string, string> = {}
    request.headers.forEach((value, key) => { allHeaders[key] = value })
    console.error("[getUserIdFromRequest] Headers:", JSON.stringify(allHeaders))
  }

  // Fall back to NextAuth session (for browser users)
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string } } | null
    if (session?.user?.id) return session.user.id
    console.error("[getUserIdFromRequest] getServerSession returned no valid id")
  } catch (e) {
    console.error("[getUserIdFromRequest] getServerSession threw:", e)
  }

  return null
}
