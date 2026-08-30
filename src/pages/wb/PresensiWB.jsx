import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCamera,
  faCircleCheck,
  faLock,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import {
  checkinPresensi,
  hasCheckedInForSession,
  todayISO,
} from "../../services/wbServices";
import CaptureAttendanceModal from "../../components/common/CaptureAttendanceModal";

const HARI_INDEX = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

const formatCountdown = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
};

const PresensiWB = () => {
  const { currentUser } = useAuth();
  const [jadwal, setJadwal] = useState([]);
  const [sessionsToday, setSessionsToday] = useState([]);
  const [checkedInSessionIds, setCheckedInSessionIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState(null); // sesi yang lagi dibuka modal
  const [presensiMode, setPresensiMode] = useState("luring"); // luring | daring
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [invoices, setInvoices] = useState([]);

  const hariIni = HARI_INDEX[new Date().getDay()];
  const paket = currentUser?.paket;

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
    const q = query(
      collection(db, "presensi"),
      where("wbId", "==", currentUser.uid),
      where("tanggal", "==", todayISO()),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCheckedInSessionIds(
        new Set(snapshot.docs.map((d) => d.data().sessionId)),
      );
    });
    return unsubscribe;
  }, [currentUser.uid]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "invoices"),
      where("wbId", "==", currentUser.uid),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setInvoices(snapshot.docs.map((d) => d.data()));
    });
    return unsubscribe;
  }, [currentUser.uid]);

  const hasTunggakan = invoices.some((inv) => inv.status !== "LUNAS");

  const jadwalHariIni = useMemo(
    () =>
      jadwal
        .filter((j) => j.hari === hariIni && j.paket === paket)
        .sort((a, b) => a.jamMulai.localeCompare(b.jamMulai)),
    [jadwal, hariIni, paket],
  );

  const sessionFor = (scheduleId) =>
    sessionsToday.find((s) => s.scheduleId === scheduleId);

  const remainingSeconds = (session) => {
    if (session.stoppedAt) return 0;
    const startedMs =
      session.startedAt?.toMillis?.() ?? session.startedAt?.seconds * 1000;
    if (!startedMs) return null;
    const expiresMs = startedMs + session.durasiMenit * 60000;
    return Math.max(0, Math.floor((expiresMs - now) / 1000));
  };

  const handleCheckin = async ({ fotoBase64, lokasi, mode }) => {
    setMessage("");
    if (hasTunggakan) {
      setActiveSession(null);
      setMessage(
        "Presensi belum dapat diproses karena masih ada tagihan yang belum lunas.",
      );
      return;
    }
    const already = await hasCheckedInForSession(
      currentUser.uid,
      activeSession.id,
    );
    if (already) {
      setActiveSession(null);
      setMessage("Anda sudah presensi untuk kelas ini.");
      return;
    }
    await checkinPresensi(currentUser, activeSession, {
      fotoBase64,
      lokasi,
      mode,
    });
    setActiveSession(null);
  };

  const renderStatus = (item) => {
    const session = sessionFor(item.id);
    if (!session) {
      return (
        <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400">
          <FontAwesomeIcon icon={faLock} className="w-3 h-3" />
          Kelas belum dimulai
        </div>
      );
    }
    if (checkedInSessionIds.has(session.id)) {
      return (
        <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-400">
          <FontAwesomeIcon icon={faCircleCheck} className="w-3 h-3" />
          Sudah presensi
        </div>
      );
    }
    const remaining = remainingSeconds(session);
    if (remaining === null) {
      return <p className="mt-2 text-xs text-slate-400">Menyiapkan sesi…</p>;
    }
    if (remaining <= 0) {
      return (
        <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400">
          <FontAwesomeIcon icon={faLock} className="w-3 h-3" />
          Sesi telah berakhir
        </div>
      );
    }
    if (hasTunggakan) {
      return (
        <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg text-xs font-semibold text-amber-700 dark:text-amber-400">
          <FontAwesomeIcon icon={faLock} className="w-3 h-3" />
          Presensi terkunci — tagihan belum lunas
        </div>
      );
    }
    return (
      <button
        type="button"
        onClick={() => {
          setPresensiMode("luring");
          setActiveSession(session);
        }}
        className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg"
      >
        <FontAwesomeIcon icon={faCamera} className="w-3 h-3" />
        Presensi Sekarang · sisa {formatCountdown(remaining)}
      </button>
    );
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Presensi
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Presensi hanya bisa dilakukan setelah pengajar memulai kelas.
        </p>
      </div>

      {hasTunggakan && (
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl">
          <FontAwesomeIcon
            icon={faTriangleExclamation}
            className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0"
          />
          <div className="text-sm">
            <p className="text-amber-800 dark:text-amber-300">
              Mohon maaf, Anda belum dapat melakukan presensi karena masih
              memiliki tagihan yang belum lunas. Silakan selesaikan pembayaran
              terlebih dahulu — presensi akan aktif kembali secara otomatis
              setelah tagihan Anda lunas.
            </p>
            <Link
              to="/wb/tagihan"
              className="inline-block mt-1.5 text-sm font-semibold text-amber-700 dark:text-amber-400 hover:underline"
            >
              Lihat Tagihan →
            </Link>
          </div>
        </div>
      )}

      {message && (
        <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
      )}

      {loading ? (
        <p className="text-sm text-slate-400">Memuat jadwal...</p>
      ) : jadwalHariIni.length === 0 ? (
        <p className="text-sm text-slate-400">
          Tidak ada jadwal kelas hari ini.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {jadwalHariIni.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4"
            >
              <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                {item.namaMapel}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {item.jamMulai} - {item.jamSelesai}
                {item.pengajar ? ` · ${item.pengajar}` : ""}
              </p>
              {renderStatus(item)}
            </div>
          ))}
        </div>
      )}

      {activeSession && (
        <CaptureAttendanceModal
          title="Presensi"
          subtitle={`${activeSession.namaMapel} · sisa ${formatCountdown(remainingSeconds(activeSession) ?? 0)}`}
          watermarkLabel={currentUser?.nama}
          mode={presensiMode}
          onModeChange={setPresensiMode}
          onCancel={() => setActiveSession(null)}
          onSubmit={handleCheckin}
        />
      )}
    </section>
  );
};

export default PresensiWB;
