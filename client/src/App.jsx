import { useEffect, useState } from "react";
import { api } from "./api";
import { useAuth } from "./auth/AuthContext.jsx";
import AuthScreen from "./components/AuthScreen.jsx";
import RoomCard from "./components/RoomCard.jsx";
import BookingForm from "./components/BookingForm.jsx";
import BookingList from "./components/BookingList.jsx";
import Toast from "./components/Toast.jsx";

export default function App() {
  const { user, loading: authLoading, logout } = useAuth();

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center text-slate-500">Loading…</div>;
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <BookingApp user={user} onLogout={logout} />;
}

function BookingApp({ user, onLogout }) {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookingRoom, setBookingRoom] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  async function refresh() {
    setLoading(true);
    try {
      const [roomList, bookingList] = await Promise.all([api.listRooms(), api.listBookings()]);
      setRooms(roomList);
      setBookings(bookingList);
    } catch (err) {
      setToast({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBooking(payload) {
    const created = await api.createBooking(payload);
    setBookings((prev) => [...prev, created].sort((a, b) => new Date(a.start_time) - new Date(b.start_time)));
    setBookingRoom(null);
    setToast({ type: "success", message: `Booked ${created.room_name} for ${created.user_name}` });
  }

  async function handleCancel(booking) {
    try {
      await api.cancelBooking(booking.id);
      setBookings((prev) => prev.filter((b) => b.id !== booking.id));
      setToast({ type: "success", message: "Booking cancelled" });
    } catch (err) {
      setToast({ type: "error", message: err.message });
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Room Booking</h1>
            <p className="text-sm text-slate-500">Reserve a meeting room in a couple of clicks.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">
                {user.username}
                {user.role === "admin" && (
                  <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                    Admin
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={onLogout}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 space-y-10">
        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Rooms</h2>
          {loading ? (
            <p className="text-sm text-slate-500">Loading rooms…</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <RoomCard key={room.id} room={room} onBook={setBookingRoom} />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Upcoming bookings</h2>
          <BookingList bookings={bookings} currentUser={user} onCancel={handleCancel} />
        </section>
      </main>

      {bookingRoom && (
        <BookingForm
          room={bookingRoom}
          userName={user.username}
          onSubmit={handleCreateBooking}
          onClose={() => setBookingRoom(null)}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}
