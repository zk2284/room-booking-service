export default function Toast({ toast }) {
  if (!toast) return null;

  const styles =
    toast.type === "error"
      ? "bg-red-600 text-white"
      : "bg-emerald-600 text-white";

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-[fadeIn_0.15s_ease-out]">
      <div className={`rounded-lg px-4 py-3 shadow-lg text-sm font-medium ${styles}`}>
        {toast.message}
      </div>
    </div>
  );
}
