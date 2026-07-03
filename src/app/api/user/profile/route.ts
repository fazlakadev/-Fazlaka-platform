import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { publicUser } from "@/lib/user-resolver"
import { getUserIdFromRequest } from "@/lib/auth-helper"

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        secondaryEmails: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(publicUser(user))
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await request.json()
    const { name, bio, image, banner, location, website, password } = body
    const updateData: Record<string, unknown> = {}

    if (name !== undefined) updateData.name = name
    if (bio !== undefined) updateData.bio = bio
    if (image !== undefined) updateData.image = image
    if (banner !== undefined) updateData.banner = banner
    if (location !== undefined) updateData.location = location
    if (website !== undefined) updateData.website = website

    if (password) {
      updateData.password = await bcrypt.hash(password, 12)
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      include: {
        secondaryEmails: true,
      },
    })

    return NextResponse.json({
      message: "Profile updated successfully",
      user: publicUser(updatedUser),
    })
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
