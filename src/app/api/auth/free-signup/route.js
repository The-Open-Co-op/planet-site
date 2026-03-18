import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { supabase } from "@/lib/supabase";
import { addBrevoContact } from "@/lib/brevo";

export async function POST(req) {
  try {
    const { name, email } = await req.json();
    if (!email || !name) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from("members")
      .select("id")
      .eq("email", email)
      .limit(1)
      .single();

    if (existing) {
      // Already a member — just sign them in
      const token = jwt.sign(
        { email, name, isMember: true },
        process.env.NEXTAUTH_SECRET,
        { expiresIn: "30d" }
      );
      const cookieStore = await cookies();
      cookieStore.set("session-token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      });
      return NextResponse.json({ ok: true });
    }

    // Create new free member
    const { error } = await supabase
      .from("members")
      .insert({ email, name, oc_tier: "free" });

    if (error) {
      console.error("Free signup insert error:", error.message);
      return NextResponse.json({ error: "Could not create account" }, { status: 500 });
    }

    addBrevoContact({ email, name, tier: "free" });

    // Sign them in
    const token = jwt.sign(
      { email, name, isMember: true },
      process.env.NEXTAUTH_SECRET,
      { expiresIn: "30d" }
    );
    const cookieStore = await cookies();
    cookieStore.set("session-token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Free signup error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
