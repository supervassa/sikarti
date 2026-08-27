import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";

const STATUS_STYLE = {
  Hadir:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  Izin: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  Sakit: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  Alpa: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
};

const RiwayatKehadiranWB = () => {
  const { currentUser } = useAuth();
  const [riwayat, setRiwayat] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "presensi"),
      where("wbId", "==", currentUser.uid),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
      setRiwayat(items);
      setLoading(false);
    });
    return unsubscribe;
  }, [currentUser.uid]);

  const totalHadir = riwayat.filter((r) => r.status === "Hadir").length;
  const persentase = riwayat.length
    ? Math.round((totalHadir / riwayat.length) * 100)
    : 0;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Riwayat Kehadiran
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Rekap presensi Anda selama ini.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 max-w-xs">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 font-bold">
          %
        </div>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Persentase Kehadiran
        </p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">
          {persentase}%
        </p>
        <p className="text-xs text-slate-400 mt-1">
          {totalHadir} dari {riwayat.length} catatan
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-4 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="2" className="text-center py-8 text-slate-400">
                    Memuat riwayat...
                  </td>
                </tr>
              ) : riwayat.length === 0 ? (
                <tr>
                  <td colSpan="2" className="text-center py-8 text-slate-400">
                    Belum ada catatan kehadiran.
                  </td>
                </tr>
              ) : (
                riwayat.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-200">
                      {r.tanggal}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLE[r.status] || "bg-slate-100 text-slate-600"}`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default RiwayatKehadiranWB;
