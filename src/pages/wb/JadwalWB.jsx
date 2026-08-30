import React, { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";

const HARI_ORDER = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
];

const JadwalWB = () => {
  const { currentUser } = useAuth();
  const paket = currentUser?.paket;
  const [jadwal, setJadwal] = useState([]);
  const [mapel, setMapel] = useState([]);
  const [loading, setLoading] = useState(!!paket);

  useEffect(() => {
    if (!paket) return;
    // Hanya jadwal paket WB ini — bukan seluruh jadwal lembaga.
    const stopJadwal = onSnapshot(
      query(collection(db, "schedules"), where("paket", "==", paket)),
      (snapshot) => {
        setJadwal(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
    );
    const stopMapel = onSnapshot(
      query(collection(db, "subjects"), where("paket", "==", paket)),
      (snapshot) => {
        setMapel(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
    );
    return () => {
      stopJadwal();
      stopMapel();
    };
  }, [paket]);

  // Kode mapel dilihat dari nama (schedules cuma simpan namaMapel).
  const kodeByNama = useMemo(() => {
    const map = {};
    mapel.forEach((m) => {
      if (m.nama && m.kode) map[m.nama] = m.kode;
    });
    return map;
  }, [mapel]);

  const grouped = useMemo(
    () =>
      HARI_ORDER.map((hari) => ({
        hari,
        items: jadwal
          .filter((j) => j.hari === hari)
          .sort((a, b) => (a.jamMulai || "").localeCompare(b.jamMulai || "")),
      })).filter((g) => g.items.length > 0),
    [jadwal],
  );

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Jadwal Pelajaran
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Jadwal kegiatan belajar mingguan untuk {paket || "paket Anda"}.
        </p>
      </div>

      {!paket ? (
        <p className="text-sm text-slate-400">
          Program paket Anda belum diset. Hubungi admin PKBM KARTINI.
        </p>
      ) : loading ? (
        <p className="text-sm text-slate-400">Memuat jadwal...</p>
      ) : grouped.length === 0 ? (
        <p className="text-sm text-slate-400">
          Jadwal untuk {paket} belum tersedia.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {grouped.map((g) => (
            <div
              key={g.hari}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
            >
              <div className="bg-red-600 text-white px-4 py-2.5 font-semibold text-sm">
                {g.hari}
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {g.items.map((item) => (
                  <div key={item.id} className="px-4 py-3">
                    <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                      {kodeByNama[item.namaMapel] && (
                        <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {kodeByNama[item.namaMapel]}
                        </span>
                      )}
                      {item.namaMapel}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {item.jamMulai} - {item.jamSelesai}
                      {item.pengajar ? ` · ${item.pengajar}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default JadwalWB;
