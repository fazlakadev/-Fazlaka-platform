import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { Role } from "@prisma/client"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { findUserByIdentity } from "@/lib/user-resolver"

type Session = {
  user?: {
    id?: string
    email?: string | null
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions) as Session | null

    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await findUserByIdentity(session.user)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const updateData: { role?: Role; banned?: boolean } = {}
    let needsUpdate = false

    if (!user.role) {
      updateData.role = "USER"
      needsUpdate = true
    }

    if (user.banned === undefined || user.banned === null) {
      updateData.banned = false
      needsUpdate = true
    }

    if (needsUpdate) {
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          banned: true,
        },
      })

      return NextResponse.json({
        message: "User fields updated successfully",
        updated: true,
        user: updatedUser,
      })
    }

    return NextResponse.json({
      message: "User fields already exist",
      updated: false,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        banned: user.banned,
      },
    })
  } catch (error) {
    console.error("Error ensuring user fields:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
