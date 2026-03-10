import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

async function findEmailByOrderId(orderIdV2, legacyOrderId) {
  const headers = { "Content-Type": "application/json" };
  if (process.env.OC_CLIENT_ID && process.env.OC_CLIENT_SECRET) {
    headers["Client-Id"] = process.env.OC_CLIENT_ID;
    headers["Client-Secret"] = process.env.OC_CLIENT_SECRET;
  }
  if (process.env.OPEN_COLLECTIVE_API_KEY) {
    headers["Api-Key"] = process.env.OPEN_COLLECTIVE_API_KEY;
  }

  // Try v2 ID first, then legacy numeric ID
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
        }
      }`,
    }),
  });
  const data = await res.json();
  console.log("OC order lookup:", JSON.stringify(data));
  const account = data?.data?.order?.fromAccount;
  return account?.email || account?.emails?.[0] || null;
}

async function checkNocoDB(email) {
  if (!process.env.NOCODB_API_TOKEN) return false;
  const res = await fetch(
    `https://app.nocodb.com/api/v2/tables/m4p0kvu7jgvsu6u/records?where=(email,eq,${encodeURIComponent(email)})&limit=1`,
    {
      headers: { "xc-token": process.env.NOCODB_API_TOKEN },
    }
  );
  const { list } = await res.json();
  return list && list.length > 0;
}

function createSession(email) {
  return jwt.sign(
    { email, isMember: true },
    process.env.NEXTAUTH_SECRET,
    { expiresIn: "30d" }
  );
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, orderIdV2, legacyOrderId } = body;

    // Try order-based sign-in first
    if (orderIdV2 || legacyOrderId) {
      const orderEmail = await findEmailByOrderId(orderIdV2, legacyOrderId);
      if (orderEmail) {
        const sessionToken = createSession(orderEmail);
        const cookieStore = await cookies();
        cookieStore.set("session-token", sessionToken, {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          maxAge: 30 * 24 * 60 * 60,
          path: "/",
        });
        return NextResponse.json({ ok: true });
      }
      console.log("OC order lookup returned no email for", orderIdV2 || legacyOrderId);
    }

    // Fall back to email-based sign-in
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const exists = await checkNocoDB(email);
    if (!exists) {
      return NextResponse.json({ error: "not_a_member" }, { status: 403 });
    }

    const sessionToken = createSession(email);
    const cookieStore = await cookies();
    cookieStore.set("session-token", sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Quick sign-in error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
