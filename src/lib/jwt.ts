import jwt from "jsonwebtoken"

const SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret"

export function signToken(payload: { userId: string }): string {
  return jwt.sign(payload, SECRET, { expiresIn: "30d" })
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    const payload = jwt.verify(token, SECRET) as Record<string, unknown>
    // Accept both `userId` (our own tokens) and `id`/`sub` (NextAuth JWT tokens)
    const userId = (payload.userId ?? payload.id ?? payload.sub) as string | undefined
    if (!userId) return null
    return { userId }
  } catch {
    return null
  }
}
