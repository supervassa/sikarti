import { useEffect, useState } from "react";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { Link } from "react-router-dom";
import { db } from "../../config/firebase.js";

const displayTime = (value) =>
  value?.toDate
    ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(value.toDate())
    : "Belum ada data";

const SuperadminDashboard = () => {
  const [admins, setAdmins] = useState([]);
  const [logs, setLogs] = useState([]);
  useEffect(() => {
    const stopAdmins = onSnapshot(
      query(collection(db, "admins"), orderBy("lastLogin", "desc"), limit(5)),
      (snapshot) =>
        setAdmins(
          snapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
        ),
    );
    const stopLogs = onSnapshot(
      query(
        collection(db, "auditLogs"),
        orderBy("timestamp", "desc"),
        limit(6),
      ),
      (snapshot) =>
        setLogs(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))),
    );
    return () => {
      stopAdmins();
      stopLogs();
    };
  }, []);
  const activeAdmins = admins.filter((admin) => admin.status).length;

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-violet-600 dark:text-violet-400">
            SUPERADMIN
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
            Kontrol & Monitoring
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Ringkasan aktivitas dan akses admin terbaru.
          </p>
        </div>
        <Link
          to="/superadmin/admins"
          className="rounded-xl bg-violet-600 px-4 py-2.5 text-center text-sm font-bold text-white"
        >
          Kelola Admin
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl bg-violet-600 p-5 text-white">
          <p className="text-sm text-violet-100">Total admin terpantau</p>
          <p className="mt-2 text-3xl font-bold">{admins.length}</p>
        </article>
        <article className="rounded-2xl border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 p-5">
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            Admin aktif
          </p>
          <p className="mt-2 text-3xl font-bold text-emerald-900 dark:text-emerald-200">
            {activeAdmins}
          </p>
        </article>
        <article className="rounded-2xl border border-amber-100 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 p-5">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Aktivitas terbaru
          </p>
          <p className="mt-2 text-3xl font-bold text-amber-900 dark:text-amber-200">
            {logs.length}
          </p>
        </article>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <article className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-5">
            <h2 className="font-bold">Login terakhir admin</h2>
            <Link
              to="/superadmin/admins"
              className="text-sm font-semibold text-violet-600 dark:text-violet-400"
            >
              Lihat semua
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {admins.length === 0 ? (
              <p className="p-6 text-sm text-slate-500 dark:text-slate-400">
                Belum ada admin di direktori.
              </p>
            ) : (
              admins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between px-6 py-4"
                >
                  <div>
                    <p className="font-semibold">{admin.nama}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {admin.email}
                    </p>
                  </div>
                  <p className="text-right text-xs text-slate-500 dark:text-slate-400">
                    {displayTime(admin.lastLogin)}
                  </p>
                </div>
              ))
            )}
          </div>
        </article>
        <article className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-5">
            <h2 className="font-bold">Aktivitas admin terbaru</h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {logs.length === 0 ? (
              <p className="p-6 text-sm text-slate-500 dark:text-slate-400">
                Belum ada aktivitas tercatat.
              </p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex gap-3 px-6 py-4">
                  <span className="mt-1 rounded-lg bg-violet-50 dark:bg-violet-500/10 px-2 py-1 text-[10px] font-bold text-violet-700 dark:text-violet-300">
                    {log.action}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">
                      {log.performedByName || "Pengguna"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {log.module} · {displayTime(log.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </div>
    </section>
  );
};

export default SuperadminDashboard;
