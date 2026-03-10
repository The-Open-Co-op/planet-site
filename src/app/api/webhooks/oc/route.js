import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const event = await req.json();

    // OC sends collective.member.created when someone joins
    if (event.type !== "collective.member.created") {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const email = event.data?.member?.memberAccount?.email
      || event.data?.member?.account?.email
      || event.data?.fromCollective?.email;
    if (!email) {
      console.log("OC webhook: no email in payload", JSON.stringify(event.type));
      return NextResponse.json({ ok: true, skipped: true });
    }

    if (!process.env.NOCODB_API_TOKEN) {
      console.log("OC webhook: NocoDB not configured, email:", email);
      return NextResponse.json({ ok: true });
    }

    // Check if member already exists
    const existing = await fetch(
      `https://app.nocodb.com/api/v2/tables/m4p0kvu7jgvsu6u/records?where=(email,eq,${encodeURIComponent(email)})&limit=1`,
      {
        headers: { "xc-token": process.env.NOCODB_API_TOKEN },
      }
    );
    const { list } = await existing.json();

    if (!list || list.length === 0) {
      // Create new member record
      const tierName = event.data?.member?.tier?.name || event.data?.tier?.name || "free";
      await fetch(
        "https://app.nocodb.com/api/v2/tables/m4p0kvu7jgvsu6u/records",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xc-token": process.env.NOCODB_API_TOKEN,
          },
          body: JSON.stringify({
            email,
            membership_level: tierName.toLowerCase(),
          }),
        }
      );
      console.log("OC webhook: created NocoDB record for", email);
    } else {
      console.log("OC webhook: member already exists", email);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("OC webhook error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
