import { HttpError } from "./errorHandler.js";
import { AUTH_COOKIE, verifyToken } from "../utils/auth.js";

export function requireAuth(req, res, next) {
  const token = req.cookies?.[AUTH_COOKIE];
  if (!token) {
    throw new HttpError(401, "Not logged in");
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: Number(payload.sub), username: payload.username, role: payload.role };
    next();
  } catch {
    throw new HttpError(401, "Session expired or invalid, please log in again");
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    throw new HttpError(403, "Admin access required");
  }
  next();
}
