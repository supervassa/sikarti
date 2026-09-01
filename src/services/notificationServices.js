import { db } from "../config/firebase";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import {
  faBullhorn,
  faCalendarDays,
  faCreditCard,
  faFileLines,
  faNewspaper,
} from "@fortawesome/free-solid-svg-icons";

// Notifikasi in-app berbasis kanal (audience). Satu dokumen `notifications` dibaca
// banyak orang lewat query `audiences array-contains-any <kanal milik saya>`
// (lihat src/hooks/useNotifications.js). Tidak ada Cloud Functions — semua tulis dari
// client & ditegakkan firestore.rules (hanya staff yang boleh membuat).
//
// PENTING: jangan menaruh data sensitif (nominal tagihan, dsb.) di `title`/`body`.
// `list` dibuka untuk semua pengguna login — sejajar dengan news/schedules/tugas.

// Tampilan per kategori (dipakai NotificationBell & NotificationsPage).
export const NOTIF_META = {
  jadwal: {
    label: "Jadwal",
    icon: faCalendarDays,
    tone: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  },
  tugas: {
    label: "Tugas",
    icon: faFileLines,
    tone: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400",
  },
  tagihan: {
    label: "Tagihan",
    icon: faCreditCard,
    tone: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  },
  berita: {
    label: "Berita",
    icon: faNewspaper,
    tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
  broadcast: {
    label: "Pengumuman",
    icon: faBullhorn,
    tone: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  },
};

// Kanal yang "menjadi milik" seorang pengguna. Query notifikasi WB/Pengajar memfilter
// dengan array-contains-any daftar ini (sinkron dengan notifAudienceAllowlist() di
// firestore.rules + kanal personal `u:<uid>`). Admin/superadmin tidak memakai kanal —
// halaman notifikasi mereka hanya menampilkan broadcast (query by category).
export const channelsForUser = (user) => {
  if (!user?.uid) return [];
  const base = ["all", `u:${user.uid}`];
  if (user.role === "wb") {
    return user.paket ? [...base, "wb", `wb:${user.paket}`] : [...base, "wb"];
  }
  if (user.role === "pengajar") return [...base, "pengajar"];
  return base;
};

// Route tujuan saat sebuah notifikasi diketuk. `link` dari dokumen menang; selain itu
// diturunkan dari kategori + role (mis. WB mengetuk notifikasi tugas -> /wb/tugas).
export const resolveNotifHref = (item, role) => {
  if (item?.link) return item.link;
  if (role === "wb" && item?.category === "tugas") return "/wb/tugas";
  if (role === "wb" && item?.category === "tagihan") return "/wb/tagihan";
  return null;
};

const actorRole = (actor) =>
  actor?.role === "superadmin" ? "superadmin" : "admin";

// Tulis satu notifikasi. MELEMPAR error bila gagal — pemanggil otomatis
// (notify* di bawah, dipakai adminServices) menelannya lewat .catch(); pemanggil
// interaktif (BroadcastModal) menampilkan pesan error.
export const pushNotification = async (
  { category, title, body, link, audiences },
  actor,
) => {
  const payload = {
    category,
    title: String(title || "")
      .trim()
      .slice(0, 150),
    body: String(body || "")
      .trim()
      .slice(0, 1000),
    audiences,
    createdAt: serverTimestamp(),
    createdBy: actor?.uid || "",
    createdByName: String(actor?.nama || actor?.displayName || "Admin").slice(
      0,
      100,
    ),
    createdByRole: actorRole(actor),
  };
  if (link) payload.link = String(link).slice(0, 200);
  return addDoc(collection(db, "notifications"), payload);
};

// --- Helper notifikasi otomatis (dipanggil dari adminServices) ---

export const notifyTugasBaru = (tugas, actor) =>
  pushNotification(
    {
      category: "tugas",
      title: `Tugas baru: ${tugas.judul}`,
      body: `${tugas.mapelNama} · ${tugas.paket}`,
      audiences: [`wb:${tugas.paket}`, "pengajar"],
    },
    actor,
  );

export const notifyTagihan = ({ wbId, status } = {}, actor) => {
  if (!wbId) return Promise.resolve();
  const lunas = status === "LUNAS";
  return pushNotification(
    {
      category: "tagihan",
      title: lunas ? "Pembayaran dikonfirmasi" : "Tagihan baru",
      body: lunas
        ? "Salah satu tagihan Anda telah ditandai lunas oleh admin."
        : "Ada tagihan baru untuk Anda. Buka menu Tagihan untuk rinciannya.",
      audiences: [`u:${wbId}`],
      link: "/wb/tagihan",
    },
    actor,
  );
};

export const notifyBeritaBaru = (newsId, title, actor) =>
  pushNotification(
    {
      category: "berita",
      title: `Berita baru: ${title}`,
      body: "Ada berita/pengumuman baru dari PKBM KARTINI. Ketuk untuk membaca.",
      audiences: ["wb", "pengajar"],
      link: `/berita/${newsId}`,
    },
    actor,
  );

// Tandai "sudah dilihat sampai sekarang". Fire-and-forget (menelan error sendiri).
export const markNotificationsSeen = async (uid) => {
  if (!uid) return;
  try {
    await setDoc(doc(db, "notificationReads", uid), {
      lastSeenAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn("Status baca notifikasi belum tersimpan:", err);
  }
};
