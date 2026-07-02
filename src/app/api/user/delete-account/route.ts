import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import bcrypt from "bcryptjs"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { findUserByIdentity } from "@/lib/user-resolver"

type DeleteAccountBody = {
  method?: "password" | "otp"
  password?: string
  otpCode?: string
}

type SessionWithUserId = {
  user?: {
    id?: string
    email?: string | null
  }
}

async function verifyPassword(userId: string, password?: string) {
  if (!password) return false

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  })

  if (!user?.password) return false
  return bcrypt.compare(password, user.password)
}

async function verifyOtp(userId: string, otpCode?: string) {
  if (!otpCode || !/^\d{6}$/.test(otpCode)) return false

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      otpCode: true,
      otpExpiry: true,
      otpPurpose: true,
    },
  })

  if (!user?.otpCode || user.otpCode !== otpCode) return false
  if (!user.otpExpiry || new Date() > user.otpExpiry) return false

  return user.otpPurpose === "VERIFY"
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as SessionWithUserId | null

    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json() as DeleteAccountBody
    const method = body.method || "password"
    const user = await findUserByIdentity(session.user)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userId = user.id

    const isVerified = method === "otp"
      ? await verifyOtp(userId, body.otpCode)
      : await verifyPassword(userId, body.password)

    if (!isVerified) {
      return NextResponse.json({ error: "Invalid verification" }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.contentView.deleteMany({ where: { userId } })

      if (user?.email) {
        await tx.newsletterSubscriber.deleteMany({ where: { email: user.email } })
      }

      await tx.user.delete({ where: { id: userId } })
    })

    return NextResponse.json({ message: "Account deleted successfully" })
  } catch (error) {
    console.error("Error deleting account:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
