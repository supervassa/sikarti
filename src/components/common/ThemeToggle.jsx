import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSun, faDesktop, faMoon } from "@fortawesome/free-solid-svg-icons";
import { useTheme } from "../../context/ThemeContext";

const OPTIONS = [
  { value: "light", icon: faSun, label: "Terang" },
  { value: "system", icon: faDesktop, label: "Sistem" },
  { value: "dark", icon: faMoon, label: "Gelap" },
];

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-full p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          title={opt.label}
          onClick={() => setTheme(opt.value)}
          className={`w-7 h-7 flex items-center justify-center rounded-full text-xs transition-all ${
            theme === opt.value
              ? "bg-white dark:bg-slate-600 shadow text-slate-900 dark:text-white"
              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          }`}
        >
          <FontAwesomeIcon icon={opt.icon} className="w-3.5 h-3.5" />
        </button>
      ))}
    </div>
  );
};

export default ThemeToggle;
