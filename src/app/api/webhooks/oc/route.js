import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { addBrevoContact } from "@/lib/brevo";

function mapOcTier(name) {
  const n = (name || "").toLowerCase();
  if (n.includes("catalyst")) return "catalyst";
  if (n.includes("pioneer")) return "supporter";
  if (n.includes("free")) return "free";
  return n || "free";
}

async function fetchEmailFromOC(slug) {
  const headers = { "Content-Type": "application/json" };
  if (process.env.OPEN_COLLECTIVE_API_KEY) {
    headers["Api-Key"] = process.env.OPEN_COLLECTIVE_API_KEY;
  }

  const res = await fetch("https://api.opencollective.com/graphql/v2", {
    method: "POST",
    headers,
    body: JSON.stringify({
      query: `{
        account(slug: "${slug}") {
          ... on Individual { email }
          emails
        }
      }`,
    }),
  });

  const data = await res.json();
  const account = data?.data?.account;
  return account?.email || account?.emails?.[0] || null;
}

export async function POST(req) {
  try {
    const event = await req.json();
    console.log("OC webhook received:", JSON.stringify(event));

    const member = event.data?.member;
    const mc = member?.memberCollective || member?.memberAccount || member?.account;

    const name = mc?.name || event.data?.fromCollective?.name;
    const slug = mc?.slug || event.data?.fromCollective?.slug;

    // OC webhooks don't include email — fetch it via API using the slug
    let email = mc?.email || event.data?.fromCollective?.email || event.data?.email;

    if (!email && slug) {
      console.log("OC webhook: no email in payload, fetching via API for slug:", slug);
      email = await fetchEmailFromOC(slug);
    }

    if (!email) {
      console.log("OC webhook: no email found for", slug || "unknown");
      return NextResponse.json({ ok: true, skipped: true });
    }

    const tierName =
      member?.tier?.name ||
      event.data?.tier?.name ||
      event.data?.order?.tier?.name ||
      "free";

    // Upsert member — create if new, update tier if existing
    const { error } = await supabase.from("members").upsert(
      {
        email,
        name: name || undefined,
        oc_slug: slug || undefined,
        oc_tier: mapOcTier(tierName),
      },
      { onConflict: "email", ignoreDuplicates: false }
    );

    if (error) {
      console.error("Supabase upsert error:", error.message);
    } else {
      console.log("OC webhook: upserted member", email, name, slug);
      addBrevoContact({ email, name, tier: mapOcTier(tierName) });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("OC webhook error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
