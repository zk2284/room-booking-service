# Room Booking Service

A meeting room booking app: an Express/Node API on top of an in-memory store, with a React frontend and real user accounts.

## Stack

- **Backend**: Node.js + Express (`server/`)
- **Frontend**: React + Vite + Tailwind CSS (`client/`)
- **Auth**: username/password accounts, JWT sessions in an httpOnly cookie
- **Storage**: in-memory (resets on server restart) — a database can be added later

## Features

- Sign up / log in; every booking is tied to your account, not a free-text name
- 5 rooms with names and capacities
- Book a room with a start and end time
- Rejects overlapping bookings for the same room
- Only the person who made a booking — or an admin — can cancel it
- Submitting the same booking twice returns the existing booking instead of duplicating it
- No bookings in the past; end time must be after start time
- Malformed or missing input always returns a clear error (never crashes the server)
- Clean, responsive UI: room cards, a booking modal, and a live bookings list with toast notifications

## Requirements

- Node.js 18+

## Setup

From the project root, install dependencies for both the server and client in one step:

```bash
npm run install:all
```

## Run

Start both the API and the frontend together:

```bash
npm run dev
```

- API: `http://localhost:4000`
- App: `http://localhost:5173`

Open `http://localhost:5173` in your browser — the frontend proxies API requests to the server automatically.

To run them separately instead: `npm run server` and `npm run client` (in two terminals).

### Logging in

Sign up for a normal account from the login screen. An **admin** account is seeded automatically the first time the server starts:

- Username: `admin` (override with the `ADMIN_USERNAME` env var)
- Password: printed once to the server's console on startup, unless you set `ADMIN_PASSWORD` yourself

Look for this block in the terminal running the server:

```
────────────────────────────────────────────────────────────
 Admin account created for this run:
   username: admin
   password: <random>
 Set ADMIN_USERNAME / ADMIN_PASSWORD env vars to pin these.
────────────────────────────────────────────────────────────
```

## Security

- **Passwords** are hashed with bcrypt (cost factor 12) — never stored or logged in plain text.
- **Sessions** are a JWT in an `httpOnly`, `SameSite=Lax` cookie, so it can't be read or stolen by injected JavaScript (XSS). The signing secret is either `JWT_SECRET` from the environment or a random value generated at boot (meaning restarting the server invalidates existing sessions — fine for an in-memory demo, but set `JWT_SECRET` for anything longer-lived).
- **Booking identity is server-derived, not client-supplied.** Earlier versions of this app took a `user_name` field from the request body and trusted it — meaning anyone could cancel anyone else's booking by typing their name. Every booking route now runs behind `requireAuth`, which reads the session cookie and attaches the real logged-in user; `owner_id` is set from that, and any `user_name` sent in a request body is ignored.
- **Cancellation is ownership-checked server-side**: `DELETE /api/bookings/:id` returns `403` unless `booking.ownerId === req.user.id` or the caller is an admin. This is enforced in the API itself, not just hidden in the UI — the Cancel button being disabled is a UX nicety, not the actual security boundary.
- **Admin override**: accounts with `role: "admin"` can cancel any booking. There's exactly one seeded admin account (see above); regular signups always get `role: "user"`.
- **Login is rate-limited** (10 attempts per 15 minutes per IP) to slow down password guessing, and login failures return the same generic "Invalid username or password" for both a wrong password and a nonexistent username, so the endpoint can't be used to enumerate valid accounts.
- **`helmet`** sets standard hardening headers (no sniffing, no framing, etc.), and CORS is restricted to `localhost` origins in dev (`credentials: true` so the session cookie is sent) rather than left open to any origin.

## Rooms

| ID | Name     | Capacity |
|----|----------|----------|
| 1  | Falcon   | 4        |
| 2  | Orion    | 8        |
| 3  | Meridian | 12       |
| 4  | Atlas    | 2        |
| 5  | Zephyr   | 20       |

## API

All endpoints are under `/api`. All routes except `/api/auth/*` require a valid session cookie (log in first).

### `POST /api/auth/signup`
Body: `{ "username": "alice", "password": "..." }` (username 3-30 chars, letters/numbers/underscore; password 8+ chars). Creates a `role: "user"` account and logs you in.

### `POST /api/auth/login`
Body: `{ "username": "alice", "password": "..." }`. Sets the session cookie.

### `POST /api/auth/logout`
Clears the session cookie.

### `GET /api/auth/me`
Returns the currently logged-in user.

### `GET /api/rooms`
List all rooms.

### `POST /api/bookings`
Create a booking. The booker is always the logged-in user — no `user_name` field is accepted.

```bash
curl -X POST http://localhost:4000/api/bookings \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "room_id": 1,
    "start_time": "2026-08-01T10:00:00Z",
    "end_time": "2026-08-01T11:00:00Z"
  }'
```

Responses:
- `201` — booking created (or the identical existing booking, if this is a duplicate submission)
- `400` — invalid input (missing fields, bad dates, end before start, start in the past)
- `401` — not logged in
- `404` — room does not exist
- `409` — overlaps an existing booking for that room

### `DELETE /api/bookings/:id`
Cancel a booking. Allowed only for the booking's owner or an admin.

Responses:
- `204` — cancelled
- `401` — not logged in
- `403` — you don't own this booking and aren't an admin
- `404` — booking not found

### `GET /api/rooms/:roomId/bookings?date=YYYY-MM-DD`
List all bookings for a room on a given day.

### `GET /api/bookings`
List every booking.

## Design notes

- **Storage**: in-memory only, held in the Express process. Swap in a real database later if persistence is needed — that would also make sessions and accounts survive a restart.
- **Duplicate submissions**: a booking is a duplicate if `room_id`, the logged-in user, `start_time`, and `end_time` all match an existing booking exactly — the existing booking is returned rather than creating a new one.
- **Concurrency**: booking creation is synchronous Node code with no `await` between the overlap check and the insert, so two simultaneous requests can't both pass validation and double-book a room.
- **Time zones**: all timestamps are handled as UTC internally.

## Project layout

```
server/   Express API (src/routes, src/data, src/middleware, src/utils)
client/   React app (src/components, src/auth, src/api.js)
```
