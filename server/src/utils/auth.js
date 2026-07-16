import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Falls back to a secret generated fresh at boot when JWT_SECRET isn't set,
// so no default secret ever ships in source control. The trade-off: every
// restart invalidates existing sessions (acceptable for an in-memory demo app).
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(48).toString("hex");
if (!process.env.JWT_SECRET) {
  console.warn(
    "[auth] JWT_SECRET not set — generated a random secret for this run. " +
      "Sessions will not survive a server restart. Set JWT_SECRET in production."
  );
}

const TOKEN_TTL = "8h";

export function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function signToken(user) {
  return jwt.sign({ username: user.username, role: user.role }, JWT_SECRET, {
    subject: String(user.id),
    expiresIn: TOKEN_TTL,
  });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export const AUTH_COOKIE = "token";
export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true, // not readable from JS -> not stealable via XSS
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 8 * 60 * 60 * 1000,
};
