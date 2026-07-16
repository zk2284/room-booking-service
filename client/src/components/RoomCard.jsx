const CAPACITY_ICON = (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function RoomCard({ room, onBook }) {
  return (
    <div className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{room.name}</h3>
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
            Room {room.id}
          </span>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
          {CAPACITY_ICON}
          Seats {room.capacity}
        </p>
      </div>
      <button
        onClick={() => onBook(room)}
        className="mt-4 w-full rounded-lg bg-brand-600 py-2 text-sm font-semibold text-white transition group-hover:bg-brand-700 active:bg-brand-800"
      >
        Book this room
      </button>
    </div>
  );
}
