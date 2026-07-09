import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  try {
    const { reason, details } = await request.json();

    if (!reason) {
      return NextResponse.json({ error: "السبب مطلوب" }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    const detailText = (details || "(بدون تفاصيل)").replace(/\n/g, "<br>");

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.RECEIVER_EMAIL,
      subject: `إلغاء تثبيت فذلكة - ${reason}`,
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <title>إلغاء تثبيت فذلكة</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, sans-serif; margin: 0; padding: 20px; background: #f8f9fa; }
            .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%); color: white; padding: 25px; text-align: center; }
            .header h1 { margin: 0; font-size: 20px; }
            .body { padding: 25px; }
            .label { font-size: 13px; color: #6B7280; margin-bottom: 4px; }
            .value { font-size: 16px; color: #1F2937; margin-bottom: 20px; padding: 12px; background: #F3F4F6; border-radius: 8px; }
            .footer { background: #f8f9fa; padding: 15px; text-align: center; border-top: 1px solid #e9ecef; font-size: 12px; color: #6B7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>إلغاء تثبيت فذلكة</h1>
            </div>
            <div class="body">
              <div class="label">السبب:</div>
              <div class="value">${reason}</div>
              <div class="label">التفاصيل:</div>
              <div class="value">${detailText}</div>
            </div>
            <div class="footer">تم الإرسال تلقائياً عند إلغاء تثبيت التطبيق</div>
          </div>
        </body>
        </html>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in POST /api/uninstall-feedback:", error);
    return NextResponse.json(
      { error: "فشل في إرسال البريد" },
      { status: 500 }
    );
  }
}
