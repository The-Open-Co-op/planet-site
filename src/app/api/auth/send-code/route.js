import { sendVerificationCode } from "@/auth";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    await sendVerificationCode(email);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Send code error:", error);
    return NextResponse.json(
      { error: "Failed to send code" },
      { status: 500 }
    );
  }
}
