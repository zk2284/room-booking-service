// In-memory user store. Data resets whenever the server restarts.
export const USERS_BY_USERNAME = new Map();

let nextId = 1;

export function allocateUserId() {
  return nextId++;
}

export function findUserByUsername(username) {
  return USERS_BY_USERNAME.get(username.toLowerCase());
}

export function createUser({ username, passwordHash, role }) {
  const user = { id: allocateUserId(), username, passwordHash, role };
  USERS_BY_USERNAME.set(username.toLowerCase(), user);
  return user;
}
