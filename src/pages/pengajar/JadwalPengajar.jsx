import React, { useEffect, useMemo, useRef, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlay,
  faStop,
  faCircleCheck,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import {
  startClassSession,
  stopClassSession,
  finalizeAbsentees,
} from "../../services/pengajarServices";
import { normalizeWBStatus } from "../../services/adminServices";
import CaptureAttendanceModal from "../../components/common/CaptureAttendanceModal";

const HARI_ORDER = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
];
const HARI_INDEX = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];
const todayISO = () => new Date().toISOString().slice(0, 10);

const sameName = (a, b) =>
  (a || "").trim().toLowerCase() === (b || "").trim().toLowerCase();

const formatCountdown = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
};

const JadwalPengajar = () => {
  const { currentUser } = useAuth();
  const [jadwal, setJadwal] = useState([]);
  const [sessionsToday, setSessionsToday] = useState([]);
  const [wbList, setWbList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSchedule, setActiveSchedule] = useState(null); // jadwal yang sedang dibuka modal Mulai Mengajar
  const [starting, setStarting] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [detailItem, setDetailItem] = useState(null); // jadwal yang sedang dibuka modal roster
  const [checkedInIds, setCheckedInIds] = useState(new Set());
  const [checkedInSessionId, setCheckedInSessionId] = useState(null); // sessionId yang benar2 direpresentasikan checkedInIds saat ini
  const [stopping, setStopping] = useState(false);
  const finalizeAttempted = useRef(new Set());

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "schedules"), (snapshot) => {
      setJadwal(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "classSessions"),
      where("tanggal", "==", todayISO()),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSessionsToday(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      );
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "users"), where("kd_role", "==", 22)),
      (snapshot) => {
        setWbList(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      },
    );
    return unsubscribe;
  }, []);

  // Roster kehadiran: siapa dari WB paket ini yang sudah presensi di sesi hari ini.
  // checkedInSessionId menandai sesi mana yang benar2 direpresentasikan checkedInIds,
  // supaya saat pindah jadwal tanpa sesi (atau sesi berbeda) tidak sempat nampilin data basi.
  useEffect(() => {
    if (!detailItem) return;
    const session = sessionsToday.find((s) => s.scheduleId === detailItem.id);
    if (!session) return;
    const q = query(
      collection(db, "presensi"),
      where("sessionId", "==", session.id),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCheckedInSessionId(session.id);
      setCheckedInIds(new Set(snapshot.docs.map((d) => d.data().wbId)));
    });
    return unsubscribe;
  }, [detailItem, sessionsToday]);

  // Finalisasi otomatis: begitu sesi berakhir (distop atau durasi habis) sambil pengajar
  // masih di halaman ini, WB yang belum presensi langsung ditandai Alpa. finalizeAttempted
  // (ref, bukan state) mencegah percobaan berulang tiap detik selagi request pertama diproses;
  // rules-nya sendiri (finalizedAt cuma boleh sekali) jadi pengaman terakhir kalau tetap balapan.
  useEffect(() => {
    sessionsToday.forEach((session) => {
      if (session.finalizedAt || session.pengajarId !== currentUser.uid) return;
      if (finalizeAttempted.current.has(session.id)) return;
      const startedMs =
        session.startedAt?.toMillis?.() ?? session.startedAt?.seconds * 1000;
      if (!startedMs) return;
      const ended =
        !!session.stoppedAt || now >= startedMs + session.durasiMenit * 60000;
      if (!ended) return;

      finalizeAttempted.current.add(session.id);
      const roster = wbList.filter(
        (wb) =>
          wb.paket === session.paket &&
          normalizeWBStatus(wb.status) === "AKTIF",
      );
      finalizeAbsentees(session, roster, currentUser).catch(() => {
        finalizeAttempted.current.delete(session.id); // coba lagi di tick berikutnya
      });
    });
  }, [sessionsToday, now, wbList, currentUser]);

  const jadwalSaya = useMemo(
    () => jadwal.filter((j) => sameName(j.pengajar, currentUser?.nama)),
    [jadwal, currentUser?.nama],
  );
  const grouped = useMemo(
    () =>
      HARI_ORDER.map((hari) => ({
        hari,
        items: jadwalSaya
          .filter((j) => j.hari === hari)
          .sort((a, b) => a.jamMulai.localeCompare(b.jamMulai)),
      })).filter((g) => g.items.length > 0),
    [jadwalSaya],
  );

  const hariIni = HARI_INDEX[new Date().getDay()];
  const sessionFor = (scheduleId) =>
    sessionsToday.find((s) => s.scheduleId === scheduleId);
  const rosterFor = (item) =>
    wbList.filter(
      (wb) =>
        wb.paket === item.paket && normalizeWBStatus(wb.status) === "AKTIF",
    );

  const remainingSeconds = (session) => {
    if (session.stoppedAt) return 0;
    const startedMs =
      session.startedAt?.toMillis?.() ?? session.startedAt?.seconds * 1000;
    if (!startedMs) return null; // serverTimestamp belum resolve di cache lokal
    const expiresMs = startedMs + session.durasiMenit * 60000;
    return Math.max(0, Math.floor((expiresMs - now) / 1000));
  };

  const handleStart = async ({ fotoBase64, lokasi }) => {
    setStarting(true);
    try {
      await startClassSession(activeSchedule, todayISO(), currentUser, {
        fotoBase64,
        lokasi,
      });
      setActiveSchedule(null);
    } finally {
      setStarting(false);
    }
  };

  const handleStop = async (session) => {
    if (
      !confirm(
        `Hentikan sesi "${session.namaMapel}" sekarang? Kehadiran akan langsung dicatat.`,
      )
    )
      return;
    setStopping(true);
    try {
      await stopClassSession(session, currentUser);
    } finally {
      setStopping(false);
    }
  };

  const renderAction = (item) => {
    const session = sessionFor(item.id);
    if (!session) {
      if (item.hari !== hariIni) {
        return (
          <p className="mt-2 text-xs text-slate-400">
            Jadwal untuk hari {item.hari} — belum bisa dimulai hari ini.
          </p>
        );
      }
      return (
        <button
          type="button"
          onClick={() => setActiveSchedule(item)}
          className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg"
        >
          <FontAwesomeIcon icon={faPlay} className="w-3 h-3" />
          Mulai Mengajar
        </button>
      );
    }
    if (session.finalizedAt) {
      return (
        <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-400">
          <FontAwesomeIcon icon={faCircleCheck} className="w-3 h-3" />
          Sesi selesai · kehadiran tercatat
        </div>
      );
    }
    const remaining = remainingSeconds(session);
    if (remaining === null) {
      return <p className="mt-2 text-xs text-slate-400">Memulai sesi…</p>;
    }
    if (remaining <= 0) {
      return <p className="mt-2 text-xs text-slate-400">Menyelesaikan sesi…</p>;
    }
    return (
      <div className="mt-2 space-y-2">
        <div className="px-3 py-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-center">
          <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
            Sesi Berlangsung
          </p>
          <p className="text-lg font-bold text-emerald-800 dark:text-emerald-300 tabular-nums">
            {formatCountdown(remaining)}
          </p>
        </div>
        <button
          type="button"
          disabled={stopping}
          onClick={() => handleStop(session)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 disabled:opacity-60"
        >
          <FontAwesomeIcon icon={faStop} className="w-3 h-3" />
          Stop
        </button>
      </div>
    );
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Jadwal Mengajar
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Tap <span className="font-semibold">Mulai Mengajar</span> pada jadwal
          hari ini untuk membuka presensi WB.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Memuat jadwal...</p>
      ) : grouped.length === 0 ? (
        <p className="text-sm text-slate-400">
          Belum ada jadwal mengajar untuk Anda. Hubungi admin jika ini keliru.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {grouped.map((g) => (
            <div
              key={g.hari}
              className={`bg-white dark:bg-slate-900 rounded-2xl border shadow-sm overflow-hidden ${g.hari === hariIni ? "border-red-300 dark:border-red-500/40" : "border-slate-200 dark:border-slate-800"}`}
            >
              <div
                className={`px-4 py-2.5 font-semibold text-sm text-white ${g.hari === hariIni ? "bg-red-600" : "bg-slate-700"}`}
              >
                {g.hari}
                {g.hari === hariIni ? " · Hari Ini" : ""}
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {g.items.map((item) => (
                  <div key={item.id} className="px-4 py-3">
                    <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                      {item.namaMapel}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {item.jamMulai} - {item.jamSelesai} · {item.paket}
                    </p>
                    <button
                      type="button"
                      onClick={() => setDetailItem(item)}
                      className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <FontAwesomeIcon icon={faUsers} className="w-3 h-3" />
                      {rosterFor(item).length} WB · Detail
                    </button>
                    {renderAction(item)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeSchedule && (
        <CaptureAttendanceModal
          title="Mulai Mengajar"
          subtitle={`${activeSchedule.namaMapel} · ${activeSchedule.jamMulai} - ${activeSchedule.jamSelesai}`}
          watermarkLabel={currentUser?.nama}
          onCancel={() => !starting && setActiveSchedule(null)}
          onSubmit={handleStart}
        />
      )}

      {detailItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl max-h-[85vh] overflow-y-auto">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {detailItem.namaMapel}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {detailItem.paket} · {detailItem.hari} {detailItem.jamMulai}-
                {detailItem.jamSelesai}
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />{" "}
                Sudah presensi
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />{" "}
                Belum presensi
              </span>
            </div>

            {!sessionFor(detailItem.id) && (
              <p className="text-xs text-amber-600">
                Sesi belum dimulai hari ini — semua WB masih berstatus belum
                presensi.
              </p>
            )}

            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
              {rosterFor(detailItem).length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-slate-400">
                  Belum ada WB aktif di paket ini.
                </p>
              ) : (
                rosterFor(detailItem).map((wb) => {
                  const currentSession = sessionFor(detailItem.id);
                  const isCheckedIn =
                    !!currentSession &&
                    checkedInSessionId === currentSession.id &&
                    checkedInIds.has(wb.id);
                  return (
                    <div
                      key={wb.id}
                      className="flex items-center gap-3 px-4 py-2.5"
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${isCheckedIn ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-200">
                        {wb.nama}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default JadwalPengajar;
