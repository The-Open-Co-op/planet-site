import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { supabase } from "@/lib/supabase";
import { addBrevoContact } from "@/lib/brevo";

const OC_API = "https://api.opencollective.com/graphql/v2";
const COLLECTIVE_SLUG = "open-coop";

function mapOcTier(name) {
  const n = (name || "").toLowerCase();
  if (n.includes("catalyst")) return "catalyst";
  if (n.includes("pioneer")) return "supporter";
  if (n.includes("free")) return "free";
  return n || "free";
}

function ocHeaders() {
  const headers = { "Content-Type": "application/json" };
  if (process.env.OPEN_COLLECTIVE_API_KEY) {
    headers["Personal-Token"] = process.env.OPEN_COLLECTIVE_API_KEY;
  }
  return headers;
}

async function findAccountByOrderId(orderIdV2, legacyOrderId) {
  const orderRef = orderIdV2
    ? `{ id: "${orderIdV2}" }`
    : `{ legacyId: ${legacyOrderId} }`;

  const res = await fetch(OC_API, {
    method: "POST",
    headers: ocHeaders(),
    body: JSON.stringify({
      query: `{
        order(order: ${orderRef}) {
          fromAccount {
            name
            slug
          }
          tier { name }
        }
      }`,
    }),
  });
  const data = await res.json();
  console.log("OC order lookup:", JSON.stringify(data));
  const order = data?.data?.order;
  const account = order?.fromAccount;
  return {
    name: account?.name || null,
    slug: account?.slug || null,
    tier: order?.tier?.name || null,
  };
}

async function findEmailBySlugInCollective(slug) {
  // Email is only accessible through the collective members query with Personal-Token
  const res = await fetch(OC_API, {
    method: "POST",
    headers: ocHeaders(),
    body: JSON.stringify({
      query: `{
        account(slug: "${COLLECTIVE_SLUG}") {
          members(limit: 50, orderBy: { field: CREATED_AT, direction: DESC }) {
            nodes {
              account {
                slug
                ... on Individual { email }
              }
            }
          }
        }
      }`,
    }),
  });
  const data = await res.json();
  const members = data?.data?.account?.members?.nodes || [];
  const match = members.find((m) => m.account.slug === slug);
  return match?.account?.email || null;
}

function createSession(email, name) {
  const payload = { email, isMember: true };
  if (name) payload.name = name;
  return jwt.sign(payload, process.env.NEXTAUTH_SECRET, { expiresIn: "30d" });
}

async function ensureMember(email, name, ocSlug, ocTier) {
  const { data: existing } = await supabase
    .from("members")
    .select("id")
    .eq("email", email)
    .limit(1)
    .single();

  if (existing) {
    // Update existing member with OC details if we have them
    const updates = {};
    if (name) updates.name = name;
    if (ocSlug) updates.oc_slug = ocSlug;
    if (ocTier) updates.oc_tier = ocTier;
    if (Object.keys(updates).length > 0) {
      await supabase.from("members").update(updates).eq("id", existing.id);
    }
    return existing.id;
  }

  // New member — add to Brevo
  addBrevoContact({ email, name, tier: ocTier });

  const { data: created } = await supabase
    .from("members")
    .insert({ email, name, oc_slug: ocSlug, oc_tier: ocTier })
    .select("id")
    .single();

  return created?.id;
}

function setSessionCookie(cookieStore, token) {
  cookieStore.set("session-token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, orderIdV2, legacyOrderId, ocName, ocSlug, ocTier } = body;

    let account = null;

    // Try order-based sign-in first
    if (orderIdV2 || legacyOrderId) {
      account = await findAccountByOrderId(orderIdV2, legacyOrderId);

      if (account.slug) {
        // Try to get email from collective members API
        const memberEmail = await findEmailBySlugInCollective(account.slug);
        if (memberEmail) {
          console.log("OC order: got email via collective members for", account.slug);
          const tier = mapOcTier(account.tier);
          await ensureMember(memberEmail, account.name, account.slug, tier);
          const sessionToken = createSession(memberEmail, account.name);
          const cookieStore = await cookies();
          setSessionCookie(cookieStore, sessionToken);
          return NextResponse.json({ ok: true, name: account.name });
        }
      }

      // Couldn't get email from OC — ask the user
      if (!email) {
        console.log("OC order: no email available, requesting from user. Slug:", account.slug);
        return NextResponse.json(
          { error: "need_email", name: account.name, slug: account.slug, tier: account.tier },
          { status: 400 }
        );
      }
    }

    // Email-based sign-in (either direct or after OC lookup failed)
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const normalEmail = email.toLowerCase().trim();
    const fromOC = !!(orderIdV2 || legacyOrderId);
    const memberName = account?.name || ocName || null;
    const memberSlug = account?.slug || ocSlug || null;
    const memberTier = account?.tier || ocTier || null;

    const { data: member } = await supabase
      .from("members")
      .select("id, name")
      .ilike("email", normalEmail)
      .limit(1)
      .single();

    if (!member && !fromOC) {
      return NextResponse.json({ error: "not_a_member" }, { status: 403 });
    }

    if (fromOC) {
      await ensureMember(email, memberName, memberSlug, memberTier ? mapOcTier(memberTier) : null);
    }

    const displayName = member?.name || memberName;
    const sessionToken = createSession(email, displayName);
    const cookieStore = await cookies();
    setSessionCookie(cookieStore, sessionToken);

    return NextResponse.json({ ok: true, name: displayName });
  } catch (error) {
    console.error("Quick sign-in error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
