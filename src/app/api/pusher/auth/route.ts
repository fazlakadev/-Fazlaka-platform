import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth-helper";
import { pusherServer } from "@/lib/pusher";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, image: true },
    });

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const formData = await request.formData();
    const socketId = formData.get("socket_id") as string | null;
    const channelName = formData.get("channel_name") as string | null;

    if (!socketId || !channelName) {
      return new NextResponse("Missing socket or channel", { status: 400 });
    }

    if (channelName.startsWith("private-conversation-")) {
      const conversationId = channelName.replace("private-conversation-", "");
      const participant = await prisma.conversationParticipant.findFirst({
        where: { conversationId, userId },
      });

      if (!participant) {
        return new NextResponse("Forbidden: Not a participant", { status: 403 });
      }
    }

    const authResponse = pusherServer.authorizeChannel(socketId, channelName, {
      user_id: user.id,
      user_info: {
        name: user.name,
        email: user.email,
        image: user.image,
      },
    });

    return NextResponse.json(authResponse);
  } catch (error) {
    console.error("Pusher Auth Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
