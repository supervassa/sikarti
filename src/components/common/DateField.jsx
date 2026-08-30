import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faCalendarDays,
} from "@fortawesome/free-solid-svg-icons";

// Datepicker seragam untuk seluruh aplikasi. Nilai in/out selalu string ISO
// "YYYY-MM-DD" (sama seperti <input type="date">), atau "" bila kosong.
// Popover kalender: navigasi bulan, lompat-tahun, sadar mode gelap, aksen merah.

const WEEKDAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const pad = (n) => String(n).padStart(2, "0");
const toISO = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

// "YYYY-MM-DD" -> {y, m (0-based), d}; null bila tidak valid.
const parseISO = (s) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
  if (!match) return null;
  const y = +match[1];
  const m = +match[2] - 1;
  const d = +match[3];
  const dt = new Date(y, m, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m || dt.getDate() !== d) {
    return null;
  }
  return { y, m, d };
};

const fmtDisplay = (s) => {
  const p = parseISO(s);
  if (!p) return "";
  return `${p.d} ${MONTHS[p.m].slice(0, 3)} ${p.y}`;
};

const DateField = ({
  value,
  onChange,
  disabled = false,
  required = false,
  id,
  name,
  min,
  max,
  placeholder = "Pilih tanggal",
  clearable = true,
}) => {
  const wrapRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("days"); // "days" | "years"

  const today = new Date();
  const sel = parseISO(value);
  const [view, setView] = useState(() => {
    const base = sel || { y: today.getFullYear(), m: today.getMonth() };
    return { y: base.y, m: base.m };
  });

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const togglePicker = () => {
    if (disabled) return;
    const base =
      parseISO(value) || { y: today.getFullYear(), m: today.getMonth() };
    setView({ y: base.y, m: base.m });
    setMode("days");
    setOpen((o) => !o);
  };

  const minP = parseISO(min);
  const maxP = parseISO(max);
  const outOfRange = (y, m, d) => {
    const t = new Date(y, m, d).getTime();
    if (minP && t < new Date(minP.y, minP.m, minP.d).getTime()) return true;
    if (maxP && t > new Date(maxP.y, maxP.m, maxP.d).getTime()) return true;
    return false;
  };

  const pick = (d) => {
    onChange(toISO(view.y, view.m, d));
    setOpen(false);
  };

  const shiftMonth = (delta) => {
    setView((v) => {
      const nm = v.m + delta;
      return { y: v.y + Math.floor(nm / 12), m: ((nm % 12) + 12) % 12 };
    });
  };

  const firstDow = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const isToday = (d) =>
    d &&
    today.getFullYear() === view.y &&
    today.getMonth() === view.m &&
    today.getDate() === d;
  const isSel = (d) =>
    d && sel && sel.y === view.y && sel.m === view.m && sel.d === d;

  const years = [];
  for (let i = 0; i < 16; i += 1) years.push(view.y - 7 + i);

  return (
    <div className="relative" ref={wrapRef}>
      {required && (
        // Cermin tersembunyi supaya validasi "required" bawaan form tetap jalan.
        <input
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
          required
          name={name}
          value={value || ""}
          onChange={() => {}}
        />
      )}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={togglePicker}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-left outline-none focus:border-red-500 bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span
          className={
            value
              ? "text-slate-800 dark:text-slate-100"
              : "text-slate-400"
          }
        >
          {fmtDisplay(value) || placeholder}
        </span>
        <FontAwesomeIcon
          icon={faCalendarDays}
          className="w-4 h-4 text-slate-400 shrink-0"
        />
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-2 w-72 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setMode((m) => (m === "days" ? "years" : "days"))}
              className="px-2 py-1 rounded-lg text-sm font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mode === "days"
                ? `${MONTHS[view.m]} ${view.y}`
                : `${years[0]}–${years[years.length - 1]}`}
            </button>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <FontAwesomeIcon icon={faChevronRight} className="w-3.5 h-3.5" />
            </button>
          </div>

          {mode === "days" ? (
            <>
              <div className="grid grid-cols-7 mb-1">
                {WEEKDAYS.map((w) => (
                  <div
                    key={w}
                    className="text-center text-[11px] font-semibold text-slate-400 py-1"
                  >
                    {w}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {cells.map((d, i) => {
                  if (!d) return <div key={`e${i}`} />;
                  const off = outOfRange(view.y, view.m, d);
                  const selected = isSel(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      disabled={off}
                      onClick={() => pick(d)}
                      className={[
                        "h-8 rounded-lg text-sm transition-colors",
                        off
                          ? "text-slate-300 dark:text-slate-700 cursor-not-allowed"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800",
                        selected
                          ? "bg-red-600 text-white hover:bg-red-600 font-bold"
                          : "text-slate-700 dark:text-slate-200",
                        !selected && isToday(d)
                          ? "ring-1 ring-inset ring-red-400"
                          : "",
                      ].join(" ")}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-4 gap-1">
              {years.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => {
                    setView((v) => ({ ...v, y }));
                    setMode("days");
                  }}
                  className={[
                    "py-2 rounded-lg text-sm transition-colors",
                    y === view.y
                      ? "bg-red-600 text-white font-bold"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800",
                  ].join(" ")}
                >
                  {y}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                const t = new Date();
                onChange(toISO(t.getFullYear(), t.getMonth(), t.getDate()));
                setOpen(false);
              }}
              className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline"
            >
              Hari ini
            </button>
            {clearable && value && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                Hapus
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DateField;
