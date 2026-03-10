import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { generateCode, createCodeToken } from "@/lib/otp";

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Log config (redact password)
    const smtpUser = process.env.BREVO_SMTP_USER;
    const smtpPass = process.env.BREVO_API_KEY;
    console.log("SMTP config check:", {
      host: "smtp-relay.brevo.com",
      port: 587,
      user: smtpUser ? `${smtpUser.slice(0, 3)}...` : "MISSING",
      pass: smtpPass ? `${smtpPass.slice(0, 3)}...` : "MISSING",
      to: email,
    });

    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    // Verify SMTP connection first
    console.log("Verifying SMTP connection...");
    await transporter.verify();
    console.log("SMTP connection verified");

    const code = generateCode();
    const token = createCodeToken(email, code);

    console.log("Sending email...");
    const info = await transporter.sendMail({
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
    console.log("Email sent:", info.messageId);

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Send code error:", {
      message: error.message,
      code: error.code,
      command: error.command,
      responseCode: error.responseCode,
      response: error.response,
    });
    return NextResponse.json(
      { error: `Failed to send code: ${error.message}` },
      { status: 500 }
    );
  }
}
