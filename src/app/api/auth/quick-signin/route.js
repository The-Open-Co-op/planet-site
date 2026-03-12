import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

async function findAccountByOrderId(orderIdV2, legacyOrderId) {
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
  const email = account?.email || account?.emails?.[0] || null;
  const name = account?.name || null;
  return { email, name };
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

function createSession(email, name) {
  const payload = { email, isMember: true };
  if (name) payload.name = name;
  return jwt.sign(payload, process.env.NEXTAUTH_SECRET, { expiresIn: "30d" });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, orderIdV2, legacyOrderId } = body;

    // Try order-based sign-in first
    let ocName = null;
    if (orderIdV2 || legacyOrderId) {
      const account = await findAccountByOrderId(orderIdV2, legacyOrderId);
      if (account.email) {
        ocName = account.name;
        const sessionToken = createSession(account.email, ocName);
        const cookieStore = await cookies();
        cookieStore.set("session-token", sessionToken, {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          maxAge: 30 * 24 * 60 * 60,
          path: "/",
        });
        return NextResponse.json({ ok: true, name: ocName });
      }
      console.log("OC order lookup returned no email for", orderIdV2 || legacyOrderId);
    }

    // Fall back to email-based sign-in
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // If they came from OC (have order params), trust the email and ensure NocoDB record
    const fromOC = !!(orderIdV2 || legacyOrderId);
    const exists = await checkNocoDB(email);

    if (!exists && !fromOC) {
      return NextResponse.json({ error: "not_a_member" }, { status: 403 });
    }

    if (!exists && fromOC && process.env.NOCODB_API_TOKEN) {
      // Create NocoDB record for new OC member
      await fetch(
        "https://app.nocodb.com/api/v2/tables/m4p0kvu7jgvsu6u/records",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xc-token": process.env.NOCODB_API_TOKEN,
          },
          body: JSON.stringify({ email }),
        }
      );
      console.log("Created NocoDB record for new OC member:", email);
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
