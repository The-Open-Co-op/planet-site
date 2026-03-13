import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { auth } from "@/auth";
import { supabase } from "@/lib/supabase";

export async function POST(req) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { memberId, message } = await req.json();

  if (!memberId || !message) {
    return NextResponse.json(
      { error: "memberId and message required" },
      { status: 400 }
    );
  }

  // Look up the recipient
  const { data: recipient } = await supabase
    .from("members")
    .select("email, name")
    .eq("id", memberId)
    .limit(1)
    .single();

  if (!recipient) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  // Look up the sender's name
  const { data: sender } = await supabase
    .from("members")
    .select("name")
    .eq("email", session.user.email)
    .limit(1)
    .single();

  const senderName = sender?.name || session.user.email;

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_API_KEY,
      },
    });

    await transporter.sendMail({
      from: "Collab <info@open.coop>",
      replyTo: session.user.email,
      to: recipient.email,
      subject: `Message from ${senderName} via Collab`,
      text: `${senderName} sent you a message on Collab — The Open Co-op:\n\n${message}\n\n—\nReply directly to this email to respond to ${senderName}.`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px;">
          <p style="font-size: 14px; color: #333; margin: 0 0 8px 0;">
            <strong>${senderName}</strong> sent you a message on Collab:
          </p>
          <div style="background: #f5f3ef; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="font-size: 14px; color: #333; margin: 0; white-space: pre-wrap;">${message}</p>
          </div>
          <p style="font-size: 12px; color: #999; margin: 16px 0 0 0;">
            Reply directly to this email to respond to ${senderName}.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Contact member email error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
