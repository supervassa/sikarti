import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";

const formatRupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const TagihanWB = () => {
  const { currentUser } = useAuth();
  const [tagihan, setTagihan] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "invoices"),
      where("wbId", "==", currentUser.uid),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTagihan(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, [currentUser.uid]);

  const belumLunas = tagihan.filter((t) => t.status !== "LUNAS");
  const totalTunggakan = belumLunas.reduce(
    (sum, t) => sum + (t.jumlah || 0),
    0,
  );

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Informasi Tagihan
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Riwayat dan status pembayaran Anda.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 max-w-xs">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 font-bold">
          Rp
        </div>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Total Tunggakan
        </p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">
          {formatRupiah(totalTunggakan)}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          {belumLunas.length} tagihan belum lunas
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Keterangan</th>
                <th className="px-4 py-4">Jumlah</th>
                <th className="px-4 py-4">Jatuh Tempo</th>
                <th className="px-4 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-slate-400">
                    Memuat data tagihan...
                  </td>
                </tr>
              ) : tagihan.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-slate-400">
                    Belum ada tagihan.
                  </td>
                </tr>
              ) : (
                tagihan.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-200">
                      {t.keterangan}
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-800 dark:text-slate-100">
                      {formatRupiah(t.jumlah)}
                    </td>
                    <td className="px-4 py-4 text-slate-500 dark:text-slate-400">
                      {t.jatuhTempo}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${t.status === "LUNAS" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"}`}
                      >
                        {t.status === "LUNAS" ? "Lunas" : "Belum Lunas"}
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

export default TagihanWB;
