import NextAuth from "next-auth";
import Nodemailer from "next-auth/providers/nodemailer";
import { UnstorageAdapter } from "@auth/unstorage-adapter";
import { createStorage } from "unstorage";
import redisDriver from "unstorage/drivers/redis";

const storage = createStorage({
  driver: redisDriver({
    url: process.env.REDIS_URL,
  }),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: UnstorageAdapter(storage),
  providers: [
    Nodemailer({
      server: {
        host: "smtp-relay.brevo.com",
        port: 587,
        auth: {
          user: process.env.BREVO_SMTP_USER,
          pass: process.env.BREVO_API_KEY,
        },
      },
      from: "PLANET <noreply@open.coop>",
    }),
  ],
  debug: true,
  pages: {
    signIn: "/login",
    verifyRequest: "/check-email",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

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
                      nodes {
                        role
                        account { name }
                      }
                    }
                  }
                }
              `,
              variables: {
                slug: "the-open-co-op",
                email: user.email,
              },
            }),
          }
        );

        const data = await res.json();
        const members = data?.data?.account?.members?.nodes;
        user.isMember = members && members.length > 0;
      } catch {
        user.isMember = false;
      }

      return true;
    },
    async session({ session, user }) {
      session.user.isMember = user.isMember ?? false;
      return session;
    },
  },
});
