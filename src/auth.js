import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function auth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session-token")?.value;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, process.env.NEXTAUTH_SECRET);
    return {
      user: {
        email: payload.email,
        name: payload.name || null,
        isMember: payload.isMember ?? false,
      },
    };
  } catch {
    return null;
  }
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete("session-token");
}
