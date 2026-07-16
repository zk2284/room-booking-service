function formatRange(startIso, endIso) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const dateFmt = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
  const timeFmt = new Intl.DateTimeFormat(undefined, { timeStyle: "short" });
  return `${dateFmt.format(start)} · ${timeFmt.format(start)} – ${timeFmt.format(end)}`;
}

export default function BookingList({ bookings, currentUser, onCancel }) {
  if (bookings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center text-sm text-slate-500">
        No bookings yet. Book a room above to see it here.
      </div>
    );
  }

  const isAdmin = currentUser?.role === "admin";

  return (
    <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {bookings.map((b) => {
        const isOwner = currentUser && b.user_name === currentUser.username;
        const canCancel = isOwner || isAdmin;
        return (
          <li key={b.id} className="flex items-center justify-between gap-4 px-5 py-4">
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-900">
                {b.room_name} <span className="text-slate-400">·</span> {b.user_name}
                {isAdmin && !isOwner && (
                  <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                    admin override available
                  </span>
                )}
              </p>
              <p className="text-sm text-slate-500">{formatRange(b.start_time, b.end_time)}</p>
            </div>
            <button
              onClick={() => onCancel(b)}
              disabled={!canCancel}
              title={canCancel ? "Cancel this booking" : "Only the person who booked this (or an admin) can cancel it"}
              className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-transparent disabled:hover:text-slate-600"
            >
              Cancel
            </button>
          </li>
        );
      })}
    </ul>
  );
}
