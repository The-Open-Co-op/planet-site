import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { createClient } from "redis";
import crypto from "crypto";
import nodemailer from "nodemailer";

let redisClient;

async function getRedis() {
  if (!redisClient) {
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on("error", (err) => console.error("Redis error:", err));
    await redisClient.connect();
  }
  return redisClient;
}

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_API_KEY,
  },
});

// Send magic code via email, store in Redis
export async function sendVerificationCode(email) {
  const code = crypto.randomInt(100000, 999999).toString();
  const redis = await getRedis();
  await redis.set(`auth:code:${email}`, code, { EX: 600 }); // 10 min expiry

  await transporter.sendMail({
    from: "PLANET <noreply@open.coop>",
    to: email,
    subject: "Your PLANET sign-in code",
    text: `Your sign-in code is: ${code}\n\nThis code expires in 10 minutes.`,
    html: `
      <div style="font-family: sans-serif; max-width: 400px;">
        <h2>Your sign-in code</h2>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 4px; margin: 24px 0;">${code}</p>
        <p style="color: #666;">This code expires in 10 minutes.</p>
      </div>
    `,
  });
}

// Verify code against Redis
async function verifyCode(email, code) {
  const redis = await getRedis();
  const stored = await redis.get(`auth:code:${email}`);
  if (!stored || stored !== code) return false;
  await redis.del(`auth:code:${email}`);
  return true;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      id: "email-code",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "Code", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const code = credentials?.code;
        if (!email || !code) return null;

        const valid = await verifyCode(email, code);
        if (!valid) return null;

        // Check OC membership
        let isMember = false;
        try {
          const res = await fetch(
            "https://api.opencollective.com/graphql/v2",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(process.env.OPEN_COLLECTIVE_API_KEY && {
                  "Api-Key": process.env.OPEN_COLLECTIVE_API_KEY,
                }),
              },
              body: JSON.stringify({
                query: `
                  query($slug: String!, $email: EmailAddress!) {
                    account(slug: $slug) {
                      members(email: $email, limit: 1) {
                        nodes { role }
                      }
                    }
                  }
                `,
                variables: { slug: "the-open-co-op", email },
              }),
            }
          );
          const data = await res.json();
          const members = data?.data?.account?.members?.nodes;
          isMember = members && members.length > 0;
        } catch {
          isMember = false;
        }

        return { email, isMember };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.isMember = user.isMember ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.email = token.email;
      session.user.isMember = token.isMember ?? false;
      return session;
    },
  },
});
