import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabase } from "@/lib/supabase";

export async function POST(req) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { description } = await req.json();
  if (!description) {
    return NextResponse.json(
      { error: "description required" },
      { status: 400 }
    );
  }

  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("email", session.user.email)
    .limit(1)
    .single();

  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const { error } = await supabase.from("help_requests").insert({
    member_id: member.id,
    description,
  });

  if (error) {
    console.error("Help request error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export const dynamic = "force-dynamic";

export async function GET() {
  const { data: requests } = await supabase
    .from("help_requests")
    .select("*, members(name), help_replies(*, members(name))")
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({ requests: requests || [] });
}
