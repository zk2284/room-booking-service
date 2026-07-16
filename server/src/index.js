import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { roomsRouter } from "./routes/rooms.js";
import { bookingsRouter } from "./routes/bookings.js";
import { authRouter } from "./routes/auth.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { seedAdmin } from "./seedAdmin.js";

const app = express();
const PORT = process.env.PORT || 4000;

// Only localhost origins are allowed in dev; set CLIENT_ORIGIN for a real deployment.
const LOCALHOST_ORIGIN = /^http:\/\/localhost:\d+$/;

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || LOCALHOST_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use("/api", authRouter);
app.use("/api", roomsRouter);
app.use("/api", bookingsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

await seedAdmin();

app.listen(PORT, () => {
  console.log(`Room Booking API listening on http://localhost:${PORT}`);
});
