import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../config/firebase";
import {
  channelsForUser,
  markNotificationsSeen,
} from "../services/notificationServices";

const HARI_INDEX = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];
const REMINDER_LEAD_MS = 2 * 60 * 60 * 1000; // pengingat kelas muncul 2 jam sebelum mulai
const TICK_MS = 60_000;

const todayISO = () => new Date().toISOString().slice(0, 10);
const sameName = (a, b) =>
  (a || "").trim().toLowerCase() === (b || "").trim().toLowerCase();
const toMillis = (ts) =>
  ts?.toMillis?.() ?? (typeof ts?.seconds === "number" ? ts.seconds * 1000 : 0);
const hhmmToMs = (dayDate, hhmm) => {
  const [h, m] = String(hhmm || "")
    .split(":")
    .map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const d = new Date(dayDate);
  d.setHours(h, m, 0, 0);
  return d.getTime();
};
const basePathForRole = (role) =>
  role === "wb" ? "/wb" : role === "pengajar" ? "/pengajar" : "/admin";

// Sumber tunggal untuk daftar & badge notifikasi. Menggabungkan:
//  - notifikasi tersimpan (koleksi `notifications`): WB/Pengajar difilter per kanal
//    miliknya; Admin/Superadmin hanya broadcast (query by category).
//  - pengingat jadwal turunan untuk WB/Pengajar (dihitung dari `schedules`, tidak
//    disimpan) — muncul ~2 jam sebelum kelas hari ini sampai kelas selesai.
export const useNotifications = (user) => {
  const uid = user?.uid ?? null;
  const role = user?.role ?? null;
  const paket = user?.paket ?? null;
  const nama = user?.nama ?? null;
  const isStaff = role === "admin" || role === "superadmin";
  const wantsJadwalReminder = role === "wb" || role === "pengajar";

  const [persisted, setPersisted] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [lastSeenMs, setLastSeenMs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [nowTick, setNowTick] = useState(() => Date.now());

  // notifications (tersimpan)
  useEffect(() => {
    if (!uid) return undefined;
    // Staf: hanya broadcast (riwayat pengumuman). WB/Pengajar: notifikasi di kanalnya.
    const ref = isStaff
      ? query(
          collection(db, "notifications"),
          where("category", "==", "broadcast"),
        )
      : query(
          collection(db, "notifications"),
          where(
            "audiences",
            "array-contains-any",
            channelsForUser({ uid, role, paket }),
          ),
        );
    const unsub = onSnapshot(
      ref,
      (snap) => {
        // `estimate`: serverTimestamp yang belum resolve dikira waktu lokal (bukan null),
        // jadi notifikasi yang baru dibuat langsung punya `createdAt` yang masuk akal.
        setPersisted(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data({ serverTimestamps: "estimate" }),
          })),
        );
        setLoading(false);
      },
      (err) => {
        console.warn("Gagal memuat notifikasi:", err);
        setLoading(false);
      },
    );
    return unsub;
  }, [uid, role, paket, isStaff]);

  // penanda "sudah dilihat"
  useEffect(() => {
    if (!uid) return undefined;
    const unsub = onSnapshot(
      doc(db, "notificationReads", uid),
      (snap) =>
        setLastSeenMs(
          snap.exists()
            ? toMillis(snap.data({ serverTimestamps: "estimate" }).lastSeenAt)
            : 0,
        ),
      () => setLastSeenMs(0),
    );
    return unsub;
  }, [uid]);

  // schedules untuk pengingat jadwal (hanya WB & Pengajar)
  useEffect(() => {
    if (!wantsJadwalReminder) return undefined;
    const unsub = onSnapshot(
      collection(db, "schedules"),
      (snap) => setSchedules(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.warn("Gagal memuat jadwal untuk pengingat:", err),
    );
    return unsub;
  }, [wantsJadwalReminder]);

  // ticker: pengingat jadwal muncul/hilang tanpa reload
  useEffect(() => {
    if (!wantsJadwalReminder) return undefined;
    const id = setInterval(() => setNowTick(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, [wantsJadwalReminder]);

  const jadwalReminders = useMemo(() => {
    if (!wantsJadwalReminder) return [];
    const now = nowTick;
    const today = new Date(now);
    const hariIni = HARI_INDEX[today.getDay()];
    const iso = todayISO();
    const base = basePathForRole(role);
    const out = [];
    for (const s of schedules) {
      if (s.hari !== hariIni) continue;
      if (role === "wb" && s.paket !== paket) continue;
      if (role === "pengajar" && !sameName(s.pengajar, nama)) continue;
      const startMs = hhmmToMs(today, s.jamMulai);
      if (startMs == null) continue;
      const endMs = hhmmToMs(today, s.jamSelesai) ?? startMs + 60 * 60 * 1000;
      const showFrom = startMs - REMINDER_LEAD_MS;
      if (now < showFrom || now >= endMs) continue;
      out.push({
        id: `jadwal_${s.id}_${iso}`,
        category: "jadwal",
        title: `Kelas ${s.namaMapel} hari ini`,
        body: `${s.jamMulai}${s.jamSelesai ? `–${s.jamSelesai}` : ""} · ${s.paket}`,
        link: `${base}/jadwal`,
        ts: showFrom,
      });
    }
    return out;
  }, [wantsJadwalReminder, role, paket, nama, schedules, nowTick]);

  const items = useMemo(() => {
    const mapped = persisted.map((n) => ({
      id: n.id,
      category: n.category,
      title: n.title,
      body: n.body,
      link: n.link || null,
      createdBy: n.createdBy || "",
      createdByName: n.createdByName || "",
      // createdAt selalu ada berkat serverTimestamps:"estimate"; nowTick hanya jaga-jaga.
      ts: toMillis(n.createdAt) || nowTick,
    }));
    const merged = [
      ...mapped,
      ...jadwalReminders.map((r) => ({
        ...r,
        createdBy: "",
        createdByName: "",
      })),
    ];
    merged.sort((a, b) => b.ts - a.ts);
    // Notifikasi buatan sendiri (broadcast yang saya kirim) tidak dihitung "belum dibaca".
    return merged.slice(0, 60).map((it) => ({
      ...it,
      unread: it.ts > lastSeenMs && it.createdBy !== uid,
    }));
  }, [persisted, jadwalReminders, lastSeenMs, nowTick, uid]);

  const unreadCount = useMemo(
    () => items.reduce((n, it) => n + (it.unread ? 1 : 0), 0),
    [items],
  );

  const markAllSeen = useCallback(() => {
    if (!uid) return;
    setLastSeenMs(Date.now()); // optimistis; listener menyusul
    markNotificationsSeen(uid);
  }, [uid]);

  return { items, unreadCount, markAllSeen, loading };
};
