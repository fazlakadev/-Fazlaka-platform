// src/types/next-auth.d.ts
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      banned?: boolean;
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    banned?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    jti?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    banned?: boolean;
  }
}