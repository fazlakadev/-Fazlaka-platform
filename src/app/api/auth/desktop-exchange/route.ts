import { NextRequest, NextResponse } from 'next/server';
import { signToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const { userId, name, email, image } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'MissingUserId' }, { status: 400 });
    }

    const token = signToken({ userId });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: userId,
        name: name || '',
        email: email || '',
        image: image || '',
        role: 'user',
        isVerified: true,
      },
    });
  } catch (error) {
    console.error('[desktop-exchange] error:', error);
    return NextResponse.json({ success: false, error: 'InternalError' }, { status: 500 });
  }
}
