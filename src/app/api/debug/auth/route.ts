import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const token = body.token || ""
    
    if (!token) {
      // Try Authorization header
      const authHeader = request.headers.get("authorization")
      if (authHeader?.startsWith("Bearer ")) {
        const t = authHeader.slice(7)
        const payload = verifyToken(t)
        return NextResponse.json({
          method: "from_header",
          hasAuthHeader: true,
          tokenPrefix: t.slice(0, 20) + "...",
          payload,
          env: {
            hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
            nextAuthSecretLength: (process.env.NEXTAUTH_SECRET || "").length,
            nodeEnv: process.env.NODE_ENV,
          },
        })
      }
      return NextResponse.json({
        method: "no_token",
        hasAuthHeader: false,
        body,
        env: {
          hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
          nextAuthSecretLength: (process.env.NEXTAUTH_SECRET || "").length,
          nodeEnv: process.env.NODE_ENV,
        },
      })
    }

    const payload = verifyToken(token)
    return NextResponse.json({
      method: "from_body",
      tokenPrefix: token.slice(0, 20) + "...",
      payload,
      env: {
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        nextAuthSecretLength: (process.env.NEXTAUTH_SECRET || "").length,
        nodeEnv: process.env.NODE_ENV,
      },
    })
  } catch (error) {
    return NextResponse.json({
      error: String(error),
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Send a POST with { token: 'your-jwt' } or an Authorization: Bearer header to debug JWT verification",
    env: {
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      nextAuthSecretLength: (process.env.NEXTAUTH_SECRET || "").length,
      nodeEnv: process.env.NODE_ENV,
    },
  })
}
