import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faCheck } from "@fortawesome/free-solid-svg-icons";

// Dropdown seragam untuk seluruh aplikasi (pengganti <select> bawaan yang
// popup-nya tak bisa ditema, terutama di mode gelap).
//
// options: array of string ATAU { value, label, disabled? }.
// value / onChange seperti <select>, tapi onChange menerima value langsung
// (bukan event). Tipe value dipertahankan apa adanya dari options.

const normOpt = (o) =>
  o !== null && typeof o === "object"
    ? { disabled: false, ...o, label: o.label ?? String(o.value) }
    : { value: o, label: String(o), disabled: false };

const SelectField = ({
  value,
  onChange,
  options = [],
  disabled = false,
  required = false,
  name,
  id,
  placeholder = "Pilih...",
  className = "",
}) => {
  const opts = options.map(normOpt);
  const wrapRef = useRef(null);
  const listRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const selectedIdx = opts.findIndex((o) => String(o.value) === String(value));
  const selected = selectedIdx >= 0 ? opts[selectedIdx] : null;

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

  useEffect(() => {
    if (open && listRef.current && activeIdx >= 0) {
      const el = listRef.current.children[activeIdx];
      if (el) el.scrollIntoView({ block: "nearest" });
    }
  }, [open, activeIdx]);

  const choose = (o) => {
    if (o.disabled) return;
    onChange(o.value);
    setOpen(false);
  };

  const openAndFocus = () => {
    if (disabled) return;
    setActiveIdx(selectedIdx);
    setOpen((o) => !o);
  };

  const onKeyDown = (e) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (open && activeIdx >= 0) choose(opts[activeIdx]);
      else openAndFocus();
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        setActiveIdx(selectedIdx);
        setOpen(true);
        return;
      }
      const dir = e.key === "ArrowDown" ? 1 : -1;
      let i = activeIdx < 0 ? (dir > 0 ? -1 : 0) : activeIdx;
      for (let n = 0; n < opts.length; n += 1) {
        i = (i + dir + opts.length) % opts.length;
        if (!opts[i].disabled) break;
      }
      setActiveIdx(i);
    }
  };

  return (
    <div className={`relative ${className}`} ref={wrapRef}>
      {required && (
        <input
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
          required
          name={name}
          value={value ?? ""}
          onChange={() => {}}
        />
      )}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={openAndFocus}
        onKeyDown={onKeyDown}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-left outline-none focus:border-red-500 bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span
          className={
            selected
              ? "text-slate-800 dark:text-slate-100 truncate"
              : "text-slate-400 truncate"
          }
        >
          {selected ? selected.label : placeholder}
        </span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`w-3 h-3 text-slate-400 shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          ref={listRef}
          className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl py-1"
        >
          {opts.map((o, i) => {
            const isSel = String(o.value) === String(value);
            return (
              <button
                key={`${o.value}|${i}`}
                type="button"
                disabled={o.disabled}
                onMouseEnter={() => setActiveIdx(i)}
                onClick={() => choose(o)}
                className={[
                  "w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors",
                  o.disabled
                    ? "text-slate-300 dark:text-slate-700 cursor-not-allowed"
                    : "",
                  !o.disabled && i === activeIdx
                    ? "bg-slate-100 dark:bg-slate-800"
                    : "",
                  isSel
                    ? "font-semibold text-red-600 dark:text-red-400"
                    : "text-slate-700 dark:text-slate-200",
                ].join(" ")}
              >
                <FontAwesomeIcon
                  icon={faCheck}
                  className={`w-3 h-3 shrink-0 ${isSel ? "opacity-100" : "opacity-0"}`}
                />
                <span className="truncate">{o.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SelectField;
