import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { auth } from "@/auth";
import { supabase } from "@/lib/supabase";

export async function POST(req) {
  const session = await auth();
  const { category, message } = await req.json();

  if (!message) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const email = session?.user?.email;

  // Look up member ID if authenticated
  let memberId = null;
  if (email) {
    const { data: member } = await supabase
      .from("members")
      .select("id")
      .eq("email", email)
      .limit(1)
      .single();
    memberId = member?.id;
  }

  // Save to Supabase
  const { error: dbError } = await supabase.from("feedback").insert({
    member_id: memberId,
    email,
    category: category || null,
    message,
  });

  if (dbError) {
    console.error("Feedback save error:", dbError.message);
  }

  // Email to info@open.coop
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_KEY,
      },
    });

    await transporter.sendMail({
      from: "Collab <info@open.coop>",
      ...(email && { replyTo: email }),
      to: "info@open.coop",
      subject: `Collab feedback${category ? ` [${category}]` : ""}`,
      text: `From: ${email || "anonymous"}\nCategory: ${category || "none"}\n\n${message}`,
    });
  } catch (err) {
    console.error("Feedback email error:", err.message);
  }

  return NextResponse.json({ ok: true });
}
