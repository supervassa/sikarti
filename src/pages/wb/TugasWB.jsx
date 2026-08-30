import React, { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";

const millis = (ts) =>
  ts?.toMillis?.() ?? (typeof ts?.seconds === "number" ? ts.seconds * 1000 : 0);

const TugasWB = () => {
  const { currentUser } = useAuth();
  const [tugas, setTugas] = useState([]);
  const [loading, setLoading] = useState(!!currentUser?.paket);

  useEffect(() => {
    if (!currentUser?.paket) return;
    const q = query(
      collection(db, "tugas"),
      where("paket", "==", currentUser.paket),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTugas(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, [currentUser?.paket]);

  // Kelompokkan per mapel, urut tugas terbaru dulu (di sisi klien — hindari composite index).
  const groups = useMemo(() => {
    const byMapel = new Map();
    for (const t of tugas) {
      const key = t.mapelNama || "Lainnya";
      if (!byMapel.has(key)) byMapel.set(key, []);
      byMapel.get(key).push(t);
    }
    return Array.from(byMapel.entries())
      .map(([mapelNama, items]) => ({
        mapelNama,
        items: items.sort((a, b) => millis(b.createdAt) - millis(a.createdAt)),
      }))
      .sort((a, b) => a.mapelNama.localeCompare(b.mapelNama));
  }, [tugas]);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Tugas
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Daftar tugas untuk {currentUser?.paket || "paket Anda"}, dikelompokkan
          per mata pelajaran.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Memuat tugas...</p>
      ) : groups.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm px-6 py-10 text-center text-sm text-slate-400">
          Belum ada tugas.
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <div
              key={g.mapelNama}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="font-bold text-slate-900 dark:text-white">
                  {g.mapelNama}
                </h2>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {g.items.map((t) => (
                  <div
                    key={t.id}
                    className="px-6 py-3 flex items-center justify-between gap-4"
                  >
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {t.judul}
                    </p>
                    <a
                      href={t.linkFile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-500/20"
                    >
                      Buka File
                      <FontAwesomeIcon
                        icon={faUpRightFromSquare}
                        className="w-3 h-3"
                      />
                    </a>
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

export default TugasWB;
