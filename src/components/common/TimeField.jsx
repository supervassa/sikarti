import React from "react";

// Pemilih jam sederhana: dua dropdown (Jam & Menit) — tanpa ketik, tanpa panah kecil,
// semua pilihan terlihat. Nilai berupa string "HH:mm" atau "" bila belum lengkap.
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = [
  "00", "05", "10", "15", "20", "25",
  "30", "35", "40", "45", "50", "55",
];

const TimeField = ({ value, onChange, disabled }) => {
  const [h = "", m = ""] = (value || "").split(":");

  const selectCls =
    "flex-1 min-w-0 px-3 py-2.5 border rounded-lg text-base outline-none focus:border-red-500 bg-transparent disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="flex items-center gap-2">
      <select
        aria-label="Jam"
        disabled={disabled}
        value={h}
        onChange={(e) =>
          onChange(e.target.value ? `${e.target.value}:${m || "00"}` : "")
        }
        className={selectCls}
      >
        <option value="">Jam</option>
        {HOURS.map((hh) => (
          <option key={hh} value={hh}>
            {hh}
          </option>
        ))}
      </select>
      <span className="text-lg font-bold text-slate-400">:</span>
      <select
        aria-label="Menit"
        disabled={disabled || !h}
        value={m}
        onChange={(e) => onChange(`${h}:${e.target.value}`)}
        className={selectCls}
      >
        <option value="">Menit</option>
        {MINUTES.map((mm) => (
          <option key={mm} value={mm}>
            {mm}
          </option>
        ))}
      </select>
    </div>
  );
};

export default TimeField;
