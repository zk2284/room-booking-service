import { Router } from "express";
import { ROOMS, ROOMS_BY_ID } from "../data/rooms.js";
import { BOOKINGS } from "../data/bookings.js";
import { HttpError } from "../middleware/errorHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { toBookingOut } from "./bookings.js";

export const roomsRouter = Router();

roomsRouter.use(requireAuth);

roomsRouter.get("/rooms", (req, res) => {
  res.json(ROOMS);
});

roomsRouter.get("/rooms/:roomId/bookings", (req, res) => {
  const roomId = Number(req.params.roomId);
  if (!ROOMS_BY_ID.has(roomId)) {
    throw new HttpError(404, `Room ${roomId} does not exist`);
  }

  const dateParam = req.query.date;
  if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    throw new HttpError(400, "date must be in YYYY-MM-DD format");
  }
  if (Number.isNaN(new Date(dateParam).getTime())) {
    throw new HttpError(400, "date must be in YYYY-MM-DD format");
  }

  const results = [...BOOKINGS.values()]
    .filter((b) => {
      if (b.roomId !== roomId) return false;
      const startDate = b.startTime.toISOString().slice(0, 10);
      const endDate = b.endTime.toISOString().slice(0, 10);
      return startDate === dateParam || endDate === dateParam;
    })
    .map(toBookingOut)
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  res.json(results);
});
