import crypto from "node:crypto";
import { createUser, findUserByUsername } from "./data/users.js";
import { hashPassword } from "./utils/auth.js";

// Seeds one admin account at boot. If ADMIN_PASSWORD isn't set, a random
// password is generated and printed once so there is never a hardcoded
// default admin credential sitting in source control.
export async function seedAdmin() {
  const username = process.env.ADMIN_USERNAME || "admin";
  if (findUserByUsername(username)) return;

  const generated = !process.env.ADMIN_PASSWORD;
  const password = process.env.ADMIN_PASSWORD || crypto.randomBytes(9).toString("base64url");

  const passwordHash = await hashPassword(password);
  createUser({ username, passwordHash, role: "admin" });

  if (generated) {
    console.log("─".repeat(60));
    console.log(` Admin account created for this run:`);
    console.log(`   username: ${username}`);
    console.log(`   password: ${password}`);
    console.log(` Set ADMIN_USERNAME / ADMIN_PASSWORD env vars to pin these.`);
    console.log("─".repeat(60));
  }
}
