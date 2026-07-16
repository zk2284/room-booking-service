import { Router } from "express";
import rateLimit from "express-rate-limit";
import { createUser, findUserByUsername } from "../data/users.js";
import { HttpError } from "../middleware/errorHandler.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import {
  AUTH_COOKIE,
  AUTH_COOKIE_OPTIONS,
  comparePassword,
  hashPassword,
  signToken,
} from "../utils/auth.js";

export const authRouter = Router();

const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/;

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts, please try again later" },
});

function toPublicUser(user) {
  return { id: user.id, username: user.username, role: user.role };
}

authRouter.post("/auth/signup", asyncHandler(async (req, res) => {
  const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!USERNAME_RE.test(username)) {
    throw new HttpError(400, "Username must be 3-30 characters, letters/numbers/underscore only");
  }
  if (password.length < 8) {
    throw new HttpError(400, "Password must be at least 8 characters");
  }
  if (findUserByUsername(username)) {
    throw new HttpError(409, "Username is already taken");
  }

  const passwordHash = await hashPassword(password);
  const user = createUser({ username, passwordHash, role: "user" });
  const token = signToken(user);
  res.cookie(AUTH_COOKIE, token, AUTH_COOKIE_OPTIONS);
  res.status(201).json(toPublicUser(user));
}));

authRouter.post("/auth/login", loginLimiter, asyncHandler(async (req, res) => {
  const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  const user = findUserByUsername(username);
  // Same generic message whether the username or the password was wrong,
  // so a login attempt can't be used to enumerate valid usernames.
  const genericError = () => new HttpError(401, "Invalid username or password");

  if (!user) {
    throw genericError();
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    throw genericError();
  }

  const token = signToken(user);
  res.cookie(AUTH_COOKIE, token, AUTH_COOKIE_OPTIONS);
  res.json(toPublicUser(user));
}));

authRouter.post("/auth/logout", (req, res) => {
  res.clearCookie(AUTH_COOKIE, AUTH_COOKIE_OPTIONS);
  res.status(204).send();
});

authRouter.get("/auth/me", requireAuth, (req, res) => {
  res.json(req.user);
});
