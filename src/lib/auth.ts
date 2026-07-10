// lib/auth.ts
import NextAuth from "next-auth/next";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          throw new Error("EmailIsRequired");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) throw new Error("UserNotFound");
        if (user.banned) throw new Error("AccountSuspended");

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password ?? ""
        );
        if (!isPasswordValid) throw new Error("IncorrectPassword");

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        // Mint an immutable jti per login to enable session tracking & revocation.
        if (!token.jti) {
          token.jti = crypto.randomUUID();
          // Create tracked session row (device info enriched lazily on first API call).
          try {
            const now = new Date();
            const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            const existing = await prisma.userSession.findUnique({
              where: { jti: token.jti },
              select: { id: true, isRevoked: true },
            });
            if (!existing) {
              await prisma.userSession.create({
                data: {
                  userId: user.id,
                  jti: token.jti,
                  ip: null,
                  userAgent: null,
                  device: null,
                  deviceType: null,
                  browser: null,
                  browserVersion: null,
                  os: null,
                  osVersion: null,
                  lastActive: now,
                  expiresAt,
                },
              });
            } else if (existing.isRevoked) {
              const { unrevokedJti } = await import("@/lib/redis");
              await prisma.userSession.update({
                where: { id: existing.id },
                data: { isRevoked: false, revokedAt: null, lastActive: now, expiresAt },
              });
              await unrevokedJti(token.jti);
            }
          } catch (error) {
            console.error("Session tracking error:", error);
          }
        }
      }
      if (token.id || token.email) {
        const dbUser = await prisma.user.findFirst({
          where: {
            OR: [
              ...(token.id ? [{ id: token.id as string }, { googleId: token.id as string }] : []),
              ...(token.email ? [{ email: token.email }] : []),
            ],
          },
          select: { id: true, role: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },

  events: {
    async signOut({ token }) {
      if (token?.jti) {
        const { revokeSessionByJti } = await import("@/lib/sessions");
        await revokeSessionByJti(token.jti);
      }
    },
  },
  pages: {
    signIn: "/sign-in",
    error: "/auth/error",
  },

  secret: process.env.NEXTAUTH_SECRET ?? undefined,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
