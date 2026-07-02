import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface Session {
  user?: {
    id?: string
    email?: string
    name?: string
    image?: string
    role?: string
    banned?: boolean
  }
}

type UserWithSecondaryEmails = NonNullable<Awaited<ReturnType<typeof findUserByIdGoogleOrEmail>>>

function isPrivileged(role?: string) {
  const normalizedRole = role?.toUpperCase()
  return normalizedRole === "OWNER" || normalizedRole === "EDITOR" || normalizedRole === "ADMIN"
}

async function findUserByIdGoogleOrEmail(id?: string, email?: string | null) {
  const or = []

  if (id) {
    or.push({ id })
    or.push({ googleId: id })
  }

  if (email) {
    or.push({ email })
  }

  if (or.length === 0) return null

  return prisma.user.findFirst({
    where: { OR: or },
    include: {
      secondaryEmails: true,
    },
  })
}

function formatUser(user: UserWithSecondaryEmails) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    bio: user.bio,
    banner: user.banner,
    location: user.location,
    website: user.website,
    isActive: user.isActive,
    role: user.role,
    banned: user.banned,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    isVerified: !user.verificationToken,
    secondaryEmails: user.secondaryEmails.map(email => ({
      id: email.id,
      email: email.email,
      isVerified: email.isVerified,
    })),
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await getServerSession(authOptions) as Session | null

    const user = await findUserByIdGoogleOrEmail(
      id,
      session?.user?.id === id ? session.user.email : null
    )

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(formatUser(user))
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await context.params
    const body = await request.json()
    const { name, bio, image, banner, location, website, role, banned } = body

    const sessionUser = await findUserByIdGoogleOrEmail(session.user.id, session.user.email)
    const targetUser = await findUserByIdGoogleOrEmail(
      id,
      session.user.id === id ? session.user.email : null
    )

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    if (!isPrivileged(session.user.role) && sessionUser?.id !== targetUser.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    const updateData: Record<string, unknown> = {}

    if (name !== undefined) updateData.name = name
    if (bio !== undefined) updateData.bio = bio
    if (image !== undefined) updateData.image = image
    if (banner !== undefined) updateData.banner = banner
    if (location !== undefined) updateData.location = location
    if (website !== undefined) updateData.website = website

    if (isPrivileged(session.user.role)) {
      if (role !== undefined) updateData.role = role
      if (banned !== undefined) updateData.banned = banned
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUser.id },
      data: updateData,
      include: {
        secondaryEmails: true,
      },
    })

    return NextResponse.json(formatUser(updatedUser))
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
