import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { friendId } = await req.json();
    if (!friendId) {
      return NextResponse.json({ error: "friendId is required" }, { status: 400 });
    }
    if (userId === friendId) {
      return NextResponse.json({ error: "Cannot add yourself" }, { status: 400 });
    }

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, receiverId: friendId },
          { requesterId: friendId, receiverId: userId },
        ],
        status: { in: ["PENDING", "ACCEPTED"] },
      },
    });

    if (existing) return NextResponse.json({ error: "Request already exists" }, { status: 400 });

    const request = await prisma.friendship.create({
      data: { requesterId: userId, receiverId: friendId },
    });

    return NextResponse.json(request, { status: 201 });
  } catch (error) {
    console.error("Error sending friend request:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
