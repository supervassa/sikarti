import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { normalizeWBStatus } from "../../services/adminServices";

const STATUS_LABEL = { AKTIF: "Aktif", NONAKTIF: "Nonaktif", LULUS: "Lulus" };

const InformasiStudiWB = () => {
  const { currentUser } = useAuth();
  const [mapel, setMapel] = useState([]);
  const [loading, setLoading] = useState(!!currentUser?.paket);

  useEffect(() => {
    if (!currentUser?.paket) return;
    const q = query(
      collection(db, "subjects"),
      where("paket", "==", currentUser.paket),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMapel(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, [currentUser?.paket]);

  const status = normalizeWBStatus(currentUser?.status);
  const info = [
    { label: "Nama Lengkap", value: currentUser?.nama || "-" },
    { label: "Program Paket", value: currentUser?.paket || "-" },
    { label: "Tahun Angkatan", value: currentUser?.tahunAngkatan || "-" },
    { label: "NIK", value: currentUser?.nik || "-" },
    { label: "Status Akun", value: STATUS_LABEL[status] },
  ];

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Informasi Studi
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Ringkasan data akademik Anda di PKBM KARTINI.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {info.map((item) => (
          <div key={item.label}>
            <p className="text-xs text-slate-400">{item.label}</p>
            <p className="font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="font-bold text-slate-900 dark:text-white">
            Mata Pelajaran {currentUser?.paket}
          </h2>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {loading ? (
            <p className="px-6 py-8 text-center text-slate-400 text-sm">
              Memuat data mapel...
            </p>
          ) : mapel.length === 0 ? (
            <p className="px-6 py-8 text-center text-slate-400 text-sm">
              Belum ada mata pelajaran terdaftar untuk paket ini.
            </p>
          ) : (
            mapel.map((m) => (
              <div
                key={m.id}
                className="px-6 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2"
              >
                {m.kode && (
                  <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {m.kode}
                  </span>
                )}
                {m.nama}
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default InformasiStudiWB;
