"""
Room Booking Service
---------------------
A small REST API for booking meeting rooms in an office.

Run with:
    pip install fastapi uvicorn
    uvicorn main:app --reload

Then open http://127.0.0.1:8000/docs for interactive API docs.
"""

from __future__ import annotations

import itertools
import threading
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator

app = FastAPI(title="Room Booking Service")

# ---------------------------------------------------------------------------
# In-memory "database"
# ---------------------------------------------------------------------------

ROOMS = {
    1: {"id": 1, "name": "Falcon", "capacity": 4},
    2: {"id": 2, "name": "Orion", "capacity": 8},
    3: {"id": 3, "name": "Meridian", "capacity": 12},
    4: {"id": 4, "name": "Atlas", "capacity": 2},
    5: {"id": 5, "name": "Zephyr", "capacity": 20},
}

BOOKINGS: dict[int, dict] = {}
_id_counter = itertools.count(1)
_lock = threading.Lock()  # guards BOOKINGS + overlap checks against races


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------

class BookingCreate(BaseModel):
    room_id: int
    user_name: str = Field(min_length=1)
    start_time: datetime
    end_time: datetime

    @field_validator("user_name")
    @classmethod
    def user_name_not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("user_name must not be blank")
        return v

    @field_validator("start_time", "end_time")
    @classmethod
    def must_be_timezone_aware_or_naive_consistently(cls, v: datetime) -> datetime:
        # Normalize everything to UTC-aware so comparisons never blow up
        if v.tzinfo is None:
            v = v.replace(tzinfo=timezone.utc)
        else:
            v = v.astimezone(timezone.utc)
        return v


class BookingOut(BaseModel):
    id: int
    room_id: int
    room_name: str
    user_name: str
    start_time: datetime
    end_time: datetime


# ---------------------------------------------------------------------------
# Error handling — malformed / missing input must never crash the service
# ---------------------------------------------------------------------------

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Turns FastAPI's default 422 into a clean 400 with a readable message
    errors = []
    for err in exc.errors():
        field = ".".join(str(loc) for loc in err["loc"] if loc != "body")
        errors.append(f"{field}: {err['msg']}" if field else err["msg"])
    return JSONResponse(status_code=400, content={"error": "Invalid request", "details": errors})


@app.exception_handler(Exception)
async def catch_all_exception_handler(request: Request, exc: Exception):
    # Last-resort safety net so an unexpected bug returns a clean error
    # instead of crashing the process or leaking a stack trace.
    return JSONResponse(status_code=400, content={"error": f"Could not process request: {exc}"})


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def overlaps(a_start: datetime, a_end: datetime, b_start: datetime, b_end: datetime) -> bool:
    return a_start < b_end and a_end > b_start


def to_booking_out(b: dict) -> BookingOut:
    return BookingOut(
        id=b["id"],
        room_id=b["room_id"],
        room_name=ROOMS[b["room_id"]]["name"],
        user_name=b["user_name"],
        start_time=b["start_time"],
        end_time=b["end_time"],
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/rooms")
def list_rooms():
    return list(ROOMS.values())


@app.post("/bookings", response_model=BookingOut, status_code=201)
def create_booking(payload: BookingCreate):
    room = ROOMS.get(payload.room_id)
    if room is None:
        raise HTTPException(status_code=404, detail=f"Room {payload.room_id} does not exist")

    now = datetime.now(timezone.utc)

    if payload.start_time < now:
        raise HTTPException(status_code=400, detail="Booking cannot start in the past")

    if payload.end_time <= payload.start_time:
        raise HTTPException(status_code=400, detail="end_time must be after start_time")

    with _lock:
        # Idempotency: identical booking already exists -> return it, don't duplicate
        for b in BOOKINGS.values():
            if (
                b["room_id"] == payload.room_id
                and b["user_name"] == payload.user_name
                and b["start_time"] == payload.start_time
                and b["end_time"] == payload.end_time
            ):
                return to_booking_out(b)

        # Reject overlapping bookings for the same room
        for b in BOOKINGS.values():
            if b["room_id"] == payload.room_id and overlaps(
                payload.start_time, payload.end_time, b["start_time"], b["end_time"]
            ):
                raise HTTPException(
                    status_code=409,
                    detail=f"Room {room['name']} is already booked from "
                    f"{b['start_time'].isoformat()} to {b['end_time'].isoformat()}",
                )

        new_id = next(_id_counter)
        booking = {
            "id": new_id,
            "room_id": payload.room_id,
            "user_name": payload.user_name,
            "start_time": payload.start_time,
            "end_time": payload.end_time,
        }
        BOOKINGS[new_id] = booking

    return to_booking_out(booking)


@app.delete("/bookings/{booking_id}", status_code=204)
def cancel_booking(booking_id: int, user_name: Optional[str] = Query(default=None)):
    with _lock:
        booking = BOOKINGS.get(booking_id)
        if booking is None:
            raise HTTPException(status_code=404, detail="Booking not found")

        if user_name is not None and booking["user_name"] != user_name:
            raise HTTPException(
                status_code=403, detail="Only the user who made the booking can cancel it"
            )

        del BOOKINGS[booking_id]
    return None


@app.get("/rooms/{room_id}/bookings", response_model=list[BookingOut])
def list_bookings_for_room(room_id: int, date: str = Query(..., description="YYYY-MM-DD")):
    if room_id not in ROOMS:
        raise HTTPException(status_code=404, detail=f"Room {room_id} does not exist")

    try:
        day = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="date must be in YYYY-MM-DD format")

    results = [
        to_booking_out(b)
        for b in BOOKINGS.values()
        if b["room_id"] == room_id
        and (b["start_time"].date() == day or b["end_time"].date() == day)
    ]
    results.sort(key=lambda b: b.start_time)
    return results


@app.get("/bookings", response_model=list[BookingOut])
def list_all_bookings():
    return [to_booking_out(b) for b in sorted(BOOKINGS.values(), key=lambda b: b["start_time"])]
