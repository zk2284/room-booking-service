import { HttpError } from "../middleware/errorHandler.js";

// Normalizes and validates the raw request body for POST /bookings.
// The booker's identity is never taken from the body — it comes from the
// authenticated session (see routes/bookings.js) so it can't be spoofed.
export function validateBookingPayload(body) {
  const errors = [];

  const roomId = Number(body?.room_id);
  if (!Number.isInteger(roomId)) {
    errors.push("room_id: must be an integer");
  }

  const startTime = body?.start_time ? new Date(body.start_time) : null;
  if (!startTime || Number.isNaN(startTime.getTime())) {
    errors.push("start_time: must be a valid date-time");
  }

  const endTime = body?.end_time ? new Date(body.end_time) : null;
  if (!endTime || Number.isNaN(endTime.getTime())) {
    errors.push("end_time: must be a valid date-time");
  }

  if (errors.length > 0) {
    throw new HttpError(400, `Invalid request: ${errors.join(", ")}`);
  }

  return { roomId, startTime, endTime };
}
