// src/app/api/user/delete-secondary-email/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserIdFromRequest } from "@/lib/auth-helper"

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }
    
    // البحث عن البريد الإلكتروني الثانوي المراد حذفه
    const secondaryEmailToDelete = await prisma.secondaryEmail.findFirst({
      where: {
        email: email,
        userId: userId, // التأكد من أن البريد ينتمي للمستخدم الحالي
      },
    });

    if (!secondaryEmailToDelete) {
      return NextResponse.json(
        { error: "Secondary email not found" },
        { status: 404 }
      )
    }

    console.log("Found secondary email to delete:", secondaryEmailToDelete.email);

    // حذف البريد الإلكتروني الثانوي باستخدام معرفه الفريد
    await prisma.secondaryEmail.delete({
      where: {
        id: secondaryEmailToDelete.id,
      },
    });

    console.log("Successfully deleted secondary email:", email);

    return NextResponse.json(
      { message: "Secondary email deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Delete secondary email error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}