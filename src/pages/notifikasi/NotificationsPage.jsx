import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faBullhorn,
  faCheckDouble,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../hooks/useNotifications";
import {
  NOTIF_META,
  resolveNotifHref,
} from "../../services/notificationServices";
import { waktuRelatif } from "../../utils/tanggal";
import BroadcastModal from "../../components/notifikasi/BroadcastModal";

const NotificationsPage = () => {
  const { currentUser } = useAuth();
  const role = currentUser?.role;
  const isStaff = role === "admin" || role === "superadmin";
  const navigate = useNavigate();
  const { items, unreadCount, markAllSeen, loading } =
    useNotifications(currentUser);

  const [showBroadcast, setShowBroadcast] = useState(false);

  // Saat data siap: potret id yang belum dibaca (supaya penanda "Baru" tetap
  // terlihat setelah badge dinolkan), lalu tandai semua sudah dilihat. Sekali saja.
  const seededRef = useRef(false);
  const [newIds, setNewIds] = useState(() => new Set());

  useEffect(() => {
    if (seededRef.current || loading) return;
    seededRef.current = true;
    setNewIds(new Set(items.filter((i) => i.unread).map((i) => i.id)));
    markAllSeen();
  }, [loading, items, markAllSeen]);

  const openItem = (item) => {
    const href = resolveNotifHref(item, role);
    if (href) navigate(href);
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Notifikasi
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isStaff
              ? "Riwayat pengumuman (broadcast) untuk Warga Belajar & Pengajar."
              : "Pembaruan jadwal, tugas, tagihan, dan pengumuman untuk Anda."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllSeen}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <FontAwesomeIcon icon={faCheckDouble} className="w-3.5 h-3.5" />
              Tandai semua dibaca
            </button>
          )}
          {isStaff && (
            <button
              type="button"
              onClick={() => setShowBroadcast(true)}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-xl text-sm shadow transition-all"
            >
              <FontAwesomeIcon icon={faBullhorn} className="w-3.5 h-3.5" />
              Buat Broadcast
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <p className="px-6 py-12 text-center text-sm text-slate-400">
            Memuat notifikasi…
          </p>
        ) : items.length === 0 ? (
          <div className="px-6 py-14 text-center text-sm text-slate-400">
            <FontAwesomeIcon
              icon={faBell}
              className="w-6 h-6 mb-2 opacity-50"
            />
            <p>{isStaff ? "Belum ada broadcast." : "Belum ada notifikasi."}</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((it) => {
              const meta = NOTIF_META[it.category] || NOTIF_META.broadcast;
              const href = resolveNotifHref(it, role);
              const isNew = newIds.has(it.id);
              return (
                <li key={it.id}>
                  <button
                    type="button"
                    onClick={() => openItem(it)}
                    disabled={!href}
                    className={`w-full text-left px-4 sm:px-6 py-4 flex gap-3 transition-colors ${
                      href
                        ? "hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
                        : "cursor-default"
                    } ${isNew ? "bg-red-50/40 dark:bg-red-500/5" : ""}`}
                  >
                    <span
                      className={`mt-0.5 w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${meta.tone}`}
                    >
                      <FontAwesomeIcon icon={meta.icon} className="w-4 h-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          {meta.label}
                        </span>
                        {isNew && (
                          <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-red-600 text-white">
                            Baru
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400">
                          {waktuRelatif(it.ts)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {it.title}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 whitespace-pre-line">
                        {it.body}
                      </p>
                      {isStaff && it.createdByName && (
                        <p className="mt-1 text-[11px] text-slate-400">
                          oleh {it.createdByName}
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {showBroadcast && (
        <BroadcastModal
          actor={currentUser}
          onClose={() => setShowBroadcast(false)}
        />
      )}
    </section>
  );
};

export default NotificationsPage;
