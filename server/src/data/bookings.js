// In-memory booking store. Data resets whenever the server restarts.
// Node runs this module's synchronous code without interleaving, so the
// check-then-insert logic in the routes is race-free without an explicit lock.
export const BOOKINGS = new Map();

let nextId = 1;

export function allocateId() {
  return nextId++;
}
