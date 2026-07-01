import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { requestId } = await req.json();
    if (!requestId) {
      return NextResponse.json({ error: "requestId is required" }, { status: 400 });
    }

    const friendship = await prisma.friendship.findFirst({
      where: {
        id: requestId,
        receiverId: userId,
        status: "PENDING",
      },
    });

    if (!friendship) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    await prisma.friendship.delete({ where: { id: friendship.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error rejecting request:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
