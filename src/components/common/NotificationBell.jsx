import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../hooks/useNotifications";
import {
  NOTIF_META,
  resolveNotifHref,
} from "../../services/notificationServices";
import { waktuRelatif } from "../../utils/tanggal";

const NotificationBell = ({ basePath = "/admin" }) => {
  const { currentUser } = useAuth();
  const role = currentUser?.role;
  const { items, unreadCount, markAllSeen } = useNotifications(currentUser);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const preview = items.slice(0, 6);

  const openItem = (item) => {
    setOpen(false);
    const href = resolveNotifHref(item, role);
    if (href) navigate(href);
    else navigate(`${basePath}/notifikasi`);
  };

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Notifikasi"
        aria-label={
          unreadCount ? `Notifikasi, ${unreadCount} belum dibaca` : "Notifikasi"
        }
        className="relative w-9 h-9 flex items-center justify-center rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <FontAwesomeIcon icon={faBell} className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop tipis di mobile supaya panel selebar layar terasa terpisah */}
          <div
            className="fixed inset-0 z-40 bg-slate-900/10 sm:hidden"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          {/* Mobile: panel selebar layar di bawah header. Desktop: dropdown ter-anchor di kanan lonceng. */}
          <div className="fixed left-3 right-3 top-[4.5rem] z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 sm:max-w-[calc(100vw-2rem)]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Notifikasi
              </p>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllSeen}
                  className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline"
                >
                  Tandai dibaca
                </button>
              )}
            </div>

            <div className="max-h-[60vh] sm:max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {preview.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-slate-400">
                  Belum ada notifikasi.
                </p>
              ) : (
                preview.map((it) => {
                  const meta = NOTIF_META[it.category] || NOTIF_META.broadcast;
                  return (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => openItem(it)}
                      className={`w-full text-left px-4 py-3 flex gap-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                        it.unread ? "bg-red-50/40 dark:bg-red-500/5" : ""
                      }`}
                    >
                      <span
                        className={`mt-0.5 w-8 h-8 shrink-0 rounded-lg flex items-center justify-center ${meta.tone}`}
                      >
                        <FontAwesomeIcon
                          icon={meta.icon}
                          className="w-3.5 h-3.5"
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          {it.unread && (
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                          )}
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                            {it.title}
                          </span>
                        </span>
                        <span className="block text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {it.body}
                        </span>
                        <span className="block text-[11px] text-slate-400 mt-0.5">
                          {waktuRelatif(it.ts)}
                        </span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <Link
              to={`${basePath}/notifikasi`}
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Lihat semua
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
