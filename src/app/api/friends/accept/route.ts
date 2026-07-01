import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { requestId, requesterId, action } = await req.json();

    let friendship;

    if (requesterId) {
      friendship = await prisma.friendship.findFirst({
        where: {
          requesterId,
          receiverId: userId,
          status: "PENDING",
        },
      });
    } else if (requestId) {
      friendship = await prisma.friendship.findFirst({
        where: {
          id: requestId,
          receiverId: userId,
          status: "PENDING",
        },
      });
    }

    if (!friendship) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    if (action === "ACCEPT") {
      await prisma.friendship.update({
        where: { id: friendship.id },
        data: { status: "ACCEPTED" },
      });

      return NextResponse.json({ success: true });
    } else {
      await prisma.friendship.delete({ where: { id: friendship.id } });
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
