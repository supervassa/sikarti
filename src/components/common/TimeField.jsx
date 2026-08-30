import React from "react";
import SelectField from "./SelectField";

// Pemilih jam: dua dropdown (Jam & Menit). Nilai berupa string "HH:mm" atau ""
// bila belum lengkap.
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = [
  "00", "05", "10", "15", "20", "25",
  "30", "35", "40", "45", "50", "55",
];

const HOUR_OPTS = [{ value: "", label: "Jam" }, ...HOURS.map((h) => ({ value: h, label: h }))];
const MIN_OPTS = [{ value: "", label: "Menit" }, ...MINUTES.map((m) => ({ value: m, label: m }))];

const TimeField = ({ value, onChange, disabled }) => {
  const [h = "", m = ""] = (value || "").split(":");

  return (
    <div className="flex items-center gap-2">
      <SelectField
        className="flex-1 min-w-0"
        disabled={disabled}
        value={h}
        options={HOUR_OPTS}
        onChange={(val) => onChange(val ? `${val}:${m || "00"}` : "")}
      />
      <span className="text-lg font-bold text-slate-400">:</span>
      <SelectField
        className="flex-1 min-w-0"
        disabled={disabled || !h}
        value={m}
        options={MIN_OPTS}
        onChange={(val) => onChange(`${h}:${val}`)}
      />
    </div>
  );
};

export default TimeField;
