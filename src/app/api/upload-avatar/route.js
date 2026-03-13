import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/auth";

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Sanitise filename and create a unique path
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `avatars/${session.user.email.replace(/[^a-z0-9]/gi, "_")}.${ext}`;

    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Upload avatar error:", error.message, error.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
