import { Router } from "express";
import { ROOMS_BY_ID } from "../data/rooms.js";
import { BOOKINGS, allocateId } from "../data/bookings.js";
import { HttpError } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { overlaps } from "../utils/overlaps.js";
import { validateBookingPayload } from "../utils/validateBooking.js";

export const bookingsRouter = Router();

bookingsRouter.use(requireAuth);

export function toBookingOut(b) {
  return {
    id: b.id,
    room_id: b.roomId,
    room_name: ROOMS_BY_ID.get(b.roomId).name,
    user_name: b.userName,
    owner_id: b.ownerId,
    start_time: b.startTime.toISOString(),
    end_time: b.endTime.toISOString(),
  };
}

bookingsRouter.get("/bookings", (req, res) => {
  const results = [...BOOKINGS.values()]
    .sort((a, b) => a.startTime - b.startTime)
    .map(toBookingOut);
  res.json(results);
});

bookingsRouter.post("/bookings", (req, res) => {
  const { roomId, startTime, endTime } = validateBookingPayload(req.body);
  const ownerId = req.user.id;
  const userName = req.user.username;

  const room = ROOMS_BY_ID.get(roomId);
  if (!room) {
    throw new HttpError(404, `Room ${roomId} does not exist`);
  }

  if (startTime < new Date()) {
    throw new HttpError(400, "Booking cannot start in the past");
  }

  if (endTime <= startTime) {
    throw new HttpError(400, "end_time must be after start_time");
  }

  // Idempotency: an identical booking already exists -> return it, don't duplicate
  for (const b of BOOKINGS.values()) {
    if (
      b.roomId === roomId &&
      b.ownerId === ownerId &&
      b.startTime.getTime() === startTime.getTime() &&
      b.endTime.getTime() === endTime.getTime()
    ) {
      res.status(201).json(toBookingOut(b));
      return;
    }
  }

  // Reject overlapping bookings for the same room
  for (const b of BOOKINGS.values()) {
    if (b.roomId === roomId && overlaps(startTime, endTime, b.startTime, b.endTime)) {
      throw new HttpError(
        409,
        `Room ${room.name} is already booked from ${b.startTime.toISOString()} to ${b.endTime.toISOString()}`
      );
    }
  }

  const booking = { id: allocateId(), roomId, ownerId, userName, startTime, endTime };
  BOOKINGS.set(booking.id, booking);

  res.status(201).json(toBookingOut(booking));
});

bookingsRouter.delete("/bookings/:id", (req, res) => {
  const bookingId = Number(req.params.id);
  const booking = BOOKINGS.get(bookingId);
  if (!booking) {
    throw new HttpError(404, "Booking not found");
  }

  const isOwner = booking.ownerId === req.user.id;
  const isAdmin = req.user.role === "admin";
  if (!isOwner && !isAdmin) {
    throw new HttpError(403, "Only the user who made the booking (or an admin) can cancel it");
  }

  BOOKINGS.delete(bookingId);
  res.status(204).send();
});
