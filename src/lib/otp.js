import crypto from "crypto";
import jwt from "jsonwebtoken";

const SECRET = process.env.NEXTAUTH_SECRET;

export function generateCode() {
  return crypto.randomInt(100000, 999999).toString();
}

// Create a signed token containing the code + email, expires in 10 min
export function createCodeToken(email, code) {
  return jwt.sign({ email, code }, SECRET, { expiresIn: "10m" });
}

// Verify the token and check the code matches
export function verifyCodeToken(token, email, code) {
  try {
    const payload = jwt.verify(token, SECRET);
    return payload.email === email && payload.code === code;
  } catch {
    return false;
  }
}
