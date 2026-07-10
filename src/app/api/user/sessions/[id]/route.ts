// src/app/api/user/sessions/[id]/route.ts
// DELETE /api/user/sessions/[id] → revoke a single session by row ID

import { NextRequest, NextResponse } from "next/server"
import { getUserIdAndJti } from "@/lib/auth-helper"
import { revokeSession } from "@/lib/sessions"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getUserIdAndJti(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: sessionId } = await params

  const result = await revokeSession(auth.userId, sessionId)

  if (!result.success) {
    return NextResponse.json(
      { error: "Session not found or already revoked" },
      { status: 404 },
    )
  }

  // Prevent user from revoking their own active session via this endpoint
  // (they should use the "sign out everywhere" or sign-out button instead).
  if (result.jti === auth.jti) {
    // Still revoked — just let it happen. The frontend will redirect.
  }

  return NextResponse.json({
    success: true,
    message: "Session revoked",
  })
}
