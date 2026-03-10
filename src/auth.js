import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifyCodeToken } from "@/lib/otp";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      id: "email-code",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "Code", type: "text" },
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        const { email, code, token } = credentials ?? {};
        if (!email || !code || !token) return null;

        const valid = verifyCodeToken(token, email, code);
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
