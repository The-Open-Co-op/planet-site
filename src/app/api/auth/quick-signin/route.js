import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { supabase } from "@/lib/supabase";
import { addBrevoContact } from "@/lib/brevo";

function mapOcTier(name) {
  const n = (name || "").toLowerCase();
  if (n.includes("catalyst")) return "catalyst";
  if (n.includes("pioneer")) return "supporter";
  if (n.includes("free")) return "free";
  return n || "free";
}

async function fetchEmailBySlug(slug) {
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

async function findAccountByOrderId(orderIdV2, legacyOrderId) {
  const headers = { "Content-Type": "application/json" };
  if (process.env.OC_CLIENT_ID && process.env.OC_CLIENT_SECRET) {
    headers["Client-Id"] = process.env.OC_CLIENT_ID;
    headers["Client-Secret"] = process.env.OC_CLIENT_SECRET;
  }
  if (process.env.OPEN_COLLECTIVE_API_KEY) {
    headers["Api-Key"] = process.env.OPEN_COLLECTIVE_API_KEY;
  }

  const orderRef = orderIdV2
    ? `{ id: "${orderIdV2}" }`
    : `{ legacyId: ${legacyOrderId} }`;

  const res = await fetch("https://api.opencollective.com/graphql/v2", {
    method: "POST",
    headers,
    body: JSON.stringify({
      query: `{
        order(order: ${orderRef}) {
          fromAccount {
            name
            slug
            emails
            ... on Individual { email }
          }
          tier {
            name
          }
        }
      }`,
    }),
  });
  const data = await res.json();
  console.log("OC order lookup:", JSON.stringify(data));
  const order = data?.data?.order;
  const account = order?.fromAccount;
  const email = account?.email || account?.emails?.[0] || null;
  const name = account?.name || null;
  const slug = account?.slug || null;
  const tier = order?.tier?.name || null;
  return { email, name, slug, tier };
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

  if (existing) return existing.id;

  // New member — add to Brevo
  addBrevoContact({ email, name, tier: ocTier });

  const { data: created } = await supabase
    .from("members")
    .insert({ email, name, oc_slug: ocSlug, oc_tier: ocTier })
    .select("id")
    .single();

  return created?.id;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, orderIdV2, legacyOrderId } = body;

    // Try order-based sign-in first
    if (orderIdV2 || legacyOrderId) {
      const account = await findAccountByOrderId(orderIdV2, legacyOrderId);
      if (account.email) {
        await ensureMember(account.email, account.name, account.slug, mapOcTier(account.tier));
        const sessionToken = createSession(account.email, account.name);
        const cookieStore = await cookies();
        cookieStore.set("session-token", sessionToken, {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          maxAge: 30 * 24 * 60 * 60,
          path: "/",
        });
        return NextResponse.json({ ok: true, name: account.name });
      }
      // No email from order API — try fetching email by slug, then DB lookup
      if (account.slug) {
        console.log("OC order: no email from order, trying slug-based approaches for", account.slug);

        // First try fetching email directly from OC by slug
        const slugEmail = await fetchEmailBySlug(account.slug);
        if (slugEmail) {
          console.log("OC order: got email via slug API for", account.slug);
          await ensureMember(slugEmail, account.name, account.slug, mapOcTier(account.tier));
          const sessionToken = createSession(slugEmail, account.name);
          const cookieStore = await cookies();
          cookieStore.set("session-token", sessionToken, {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            maxAge: 30 * 24 * 60 * 60,
            path: "/",
          });
          return NextResponse.json({ ok: true, name: account.name });
        }

        // Fall back to slug lookup in our DB
        const { data: memberBySlug } = await supabase
          .from("members")
          .select("id, email, name")
          .eq("oc_slug", account.slug)
          .limit(1)
          .single();

        if (memberBySlug) {
          const sessionToken = createSession(memberBySlug.email, memberBySlug.name || account.name);
          const cookieStore = await cookies();
          cookieStore.set("session-token", sessionToken, {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            maxAge: 30 * 24 * 60 * 60,
            path: "/",
          });
          return NextResponse.json({ ok: true, name: memberBySlug.name || account.name });
        }
        console.log("OC order: could not resolve email for slug", account.slug);
      } else {
        console.log("OC order lookup returned no email or slug for", orderIdV2 || legacyOrderId);
      }
    }

    // Fall back to email-based sign-in
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const fromOC = !!(orderIdV2 || legacyOrderId);

    const { data: member } = await supabase
      .from("members")
      .select("id, name")
      .eq("email", email)
      .limit(1)
      .single();

    if (!member && !fromOC) {
      return NextResponse.json({ error: "not_a_member" }, { status: 403 });
    }

    if (!member && fromOC) {
      await ensureMember(email, null, null, null);
    }

    const sessionToken = createSession(email, member?.name);
    const cookieStore = await cookies();
    cookieStore.set("session-token", sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return NextResponse.json({ ok: true, name: member?.name });
  } catch (error) {
    console.error("Quick sign-in error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
