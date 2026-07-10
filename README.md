# Room Booking Service

A small REST API for booking meeting rooms in an office, built with FastAPI.

## Features

- 5 hardcoded rooms with names and capacities
- Book a room with user name, start time, and end time
- Rejects overlapping bookings for the same room
- Users can cancel their own bookings
- List all bookings for a room on a given day
- No bookings in the past; end time must be after start time
- Malformed or missing input always returns a clear error (never crashes)
- Submitting the same booking twice returns the existing booking instead of duplicating it

## Requirements

- Python 3.9+

## Setup

```bash
pip install fastapi uvicorn
```

## Run

```bash
uvicorn main:app --reload
```

The API will be available at `http://127.0.0.1:8000`.

Interactive docs (try endpoints from the browser): `http://127.0.0.1:8000/docs`

## Rooms

| ID | Name     | Capacity |
|----|----------|----------|
| 1  | Falcon   | 4        |
| 2  | Orion    | 8        |
| 3  | Meridian | 12       |
| 4  | Atlas    | 2        |
| 5  | Zephyr   | 20       |

## Endpoints

### `GET /rooms`
List all rooms.

```bash
curl http://127.0.0.1:8000/rooms
```

### `POST /bookings`
Create a booking.

```bash
curl -X POST http://127.0.0.1:8000/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "room_id": 1,
    "user_name": "Alice",
    "start_time": "2026-08-01T10:00:00",
    "end_time": "2026-08-01T11:00:00"
  }'
```

Responses:
- `201` — booking created (or the identical existing booking, if this is a duplicate submission)
- `400` — invalid input (missing fields, bad dates, end before start, start in the past)
- `404` — room does not exist
- `409` — overlaps an existing booking for that room

### `DELETE /bookings/{booking_id}?user_name=Alice`
Cancel a booking. `user_name` must match the original booker.

```bash
curl -X DELETE "http://127.0.0.1:8000/bookings/1?user_name=Alice"
```

Responses:
- `204` — cancelled
- `403` — user_name does not match the booking's owner
- `404` — booking not found

### `GET /rooms/{room_id}/bookings?date=YYYY-MM-DD`
List all bookings for a room on a given day.

```bash
curl "http://127.0.0.1:8000/rooms/1/bookings?date=2026-08-01"
```

### `GET /bookings`
List every booking (useful for debugging).

```bash
curl http://127.0.0.1:8000/bookings
```

## Design notes

- **Storage**: in-memory only. Data resets whenever the server restarts. Swap in a real database if persistence is needed.
- **Duplicate submissions**: a booking is considered a duplicate if `room_id`, `user_name`, `start_time`, and `end_time` all match an existing booking exactly. In that case the existing booking is returned rather than creating a new one.
- **Concurrency**: a lock guards the overlap-check-then-insert sequence so two simultaneous requests can't both pass validation and double-book a room.
- **Time zones**: incoming timestamps without timezone info are assumed UTC; all timestamps are normalized to UTC internally.
- **Error handling**: all input validation errors and unexpected exceptions are caught and returned as JSON with a `400` status and a readable message, so bad input can never crash the service.

## Running tests manually

A quick smoke test covering all the requirements:

```bash
# start the server first: uvicorn main:app --reload

# valid booking
curl -X POST http://127.0.0.1:8000/bookings -H "Content-Type: application/json" \
  -d '{"room_id":1,"user_name":"Alice","start_time":"2026-08-01T10:00:00","end_time":"2026-08-01T11:00:00"}'

# overlapping booking -> 409
curl -X POST http://127.0.0.1:8000/bookings -H "Content-Type: application/json" \
  -d '{"room_id":1,"user_name":"Bob","start_time":"2026-08-01T10:30:00","end_time":"2026-08-01T11:30:00"}'

# duplicate of the first booking -> 201, same id, no duplicate created
curl -X POST http://127.0.0.1:8000/bookings -H "Content-Type: application/json" \
  -d '{"room_id":1,"user_name":"Alice","start_time":"2026-08-01T10:00:00","end_time":"2026-08-01T11:00:00"}'

# malformed JSON -> 400, service stays up
curl -X POST http://127.0.0.1:8000/bookings -H "Content-Type: application/json" -d '{not valid json'
```
