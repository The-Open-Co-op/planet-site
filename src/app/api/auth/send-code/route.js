import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { generateCode, createCodeToken } from "@/lib/otp";

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_API_KEY,
  },
});

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const code = generateCode();
    const token = createCodeToken(email, code);

    await transporter.sendMail({
      from: "PLANET <noreply@open.coop>",
      to: email,
      subject: "Your PLANET sign-in code",
      text: `Your sign-in code is: ${code}\n\nThis code expires in 10 minutes.`,
      html: `
        <div style="font-family: sans-serif; max-width: 400px;">
          <h2>Your sign-in code</h2>
          <p style="font-size: 32px; font-weight: bold; letter-spacing: 4px; margin: 24px 0;">${code}</p>
          <p style="color: #666;">This code expires in 10 minutes.</p>
        </div>
      `,
    });

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Send code error:", error);
    return NextResponse.json(
      { error: "Failed to send code" },
      { status: 500 }
    );
  }
}
