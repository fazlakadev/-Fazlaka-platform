import { prisma } from "@/lib/prisma"

export type SessionIdentity = {
  id?: string | null
  email?: string | null
}

export async function findUserByIdentity(identity?: SessionIdentity | null) {
  const or = []

  if (identity?.id) {
    or.push({ id: identity.id })
    or.push({ googleId: identity.id })
  }

  if (identity?.email) {
    or.push({ email: identity.email })
  }

  if (or.length === 0) return null

  return prisma.user.findFirst({
    where: { OR: or },
    include: {
      secondaryEmails: true,
    },
  })
}

export function publicUser(user: NonNullable<Awaited<ReturnType<typeof findUserByIdentity>>>) {
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
      createdAt: email.createdAt,
    })),
  }
}
