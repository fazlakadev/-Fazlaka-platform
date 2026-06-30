import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const { code, codeVerifier, redirectUri } = await request.json();
    if (!code) {
      return NextResponse.json({ success: false, error: 'MissingCode' }, { status: 400 });
    }

    const tokenParams = new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri || 'http://localhost:8580/',
      grant_type: 'authorization_code',
    });
    if (codeVerifier) {
      tokenParams.set('code_verifier', codeVerifier);
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams,
    });

    const tokens = await tokenRes.json();
    if (!tokens.id_token) {
      console.error('Google exchange error:', JSON.stringify(tokens));
      return NextResponse.json({ success: false, error: tokens.error || 'NoIdToken' }, { status: 401 });
    }

    const payload = JSON.parse(Buffer.from(tokens.id_token.split('.')[1], 'base64').toString());
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (payload.aud !== clientId) {
      return NextResponse.json({ success: false, error: 'InvalidAudience' }, { status: 401 });
    }

    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name || email?.split('@')[0] || 'Google User';
    const image = payload.picture;

    if (!email) {
      return NextResponse.json({ success: false, error: 'EmailRequired' }, { status: 400 });
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      if (!user.googleId) {
        await prisma.user.update({
          where: { id: user.id },
          data: { googleId, image: image || user.image },
        });
      }
    } else {
      user = await prisma.user.create({
        data: {
          name,
          email,
          image,
          googleId,
          password: '',
          isActive: true,
          emailVerified: new Date(),
        },
      });
    }

    const existingAccount = await prisma.account.findFirst({
      where: { providerAccountId: googleId, provider: 'google' },
    });

    if (!existingAccount) {
      await prisma.account.create({
        data: {
          userId: user.id,
          type: 'oauth',
          provider: 'google',
          providerAccountId: googleId,
          access_token: tokens.id_token,
          token_type: 'bearer',
        },
      });
    }

    const token = signToken({ userId: user.id });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        isVerified: true,
      },
    });
  } catch (error) {
    console.error('Google exchange error:', error);
    return NextResponse.json({ success: false, error: 'InternalError' }, { status: 500 });
  }
}
