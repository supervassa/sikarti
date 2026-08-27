import { db } from "../config/firebase";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { createAuditLog } from "./adminServices";

export const classSessionId = (scheduleId, tanggal) =>
  `${scheduleId}_${tanggal}`;

const diffMinutes = (jamMulai, jamSelesai) => {
  const [h1, m1] = jamMulai.split(":").map(Number);
  const [h2, m2] = jamSelesai.split(":").map(Number);
  return h2 * 60 + m2 - (h1 * 60 + m1);
};

// Pengajar tap "Mulai Mengajar": buka jendela presensi WB untuk jadwal ini hari ini,
// sekaligus foto+lokasi yang dikirim jadi bukti kehadiran pengajar sendiri.
// ID dokumen deterministik ({scheduleId}_{tanggal}) + transaksi create-if-absent
// mencegah sesi dobel kalau tombolnya kepencet dua kali / direfresh.
export const startClassSession = async (
  schedule,
  tanggal,
  currentUser,
  { fotoBase64, lokasi },
) => {
  const id = classSessionId(schedule.id, tanggal);
  const ref = doc(db, "classSessions", id);
  const durasiMenit = diffMinutes(schedule.jamMulai, schedule.jamSelesai);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists()) {
      throw new Error("Sesi untuk kelas ini sudah dimulai sebelumnya.");
    }
    tx.set(ref, {
      scheduleId: schedule.id,
      namaMapel: schedule.namaMapel,
      paket: schedule.paket,
      hari: schedule.hari,
      tanggal,
      durasiMenit,
      pengajarId: currentUser.uid,
      pengajarNama: currentUser.nama,
      lokasi,
      fotoBase64,
      startedAt: serverTimestamp(),
    });
  });

  await createAuditLog(currentUser, "CREATE", "SESI_KELAS", id, {
    namaMapel: schedule.namaMapel,
    tanggal,
  });
  return id;
};

// Pengajar tap "Stop" sebelum durasi habis. Kalau lupa stop, sesi tetap jalan sampai
// durasinya habis sendiri — baik lewat Stop atau habis waktu, finalizeAbsentees yang
// benar-benar mencatat kehadiran (lihat di bawah).
export const stopClassSession = async (session, currentUser) => {
  await updateDoc(doc(db, "classSessions", session.id), {
    stoppedAt: serverTimestamp(),
  });
  await createAuditLog(currentUser, "UPDATE", "SESI_KELAS", session.id, {
    action: "stop",
    namaMapel: session.namaMapel,
  });
};

// Dipanggil sekali setelah sesi berakhir (distop atau durasi habis): WB aktif di paket ini
// yang belum presensi Hadir untuk sesi ini otomatis dicatat Alpa. finalizedAt jadi penanda
// idempoten di rules — percobaan kedua (mis. dua tab dibuka bareng) otomatis gagal ditolak.
export const finalizeAbsentees = async (
  session,
  wbAktifPaketIni,
  currentUser,
) => {
  const presensiSnap = await getDocs(
    query(collection(db, "presensi"), where("sessionId", "==", session.id)),
  );
  const sudahHadir = new Set(presensiSnap.docs.map((d) => d.data().wbId));
  const absen = wbAktifPaketIni.filter((wb) => !sudahHadir.has(wb.id));

  await updateDoc(doc(db, "classSessions", session.id), {
    finalizedAt: serverTimestamp(),
  });

  await Promise.all(
    absen.map((wb) =>
      addDoc(collection(db, "presensi"), {
        wbId: wb.id,
        nama: wb.nama,
        status: "Alpa",
        tanggal: session.tanggal,
        sessionId: session.id,
        namaMapel: session.namaMapel,
        recordedBy: currentUser.uid,
        createdAt: serverTimestamp(),
      }),
    ),
  );

  await createAuditLog(currentUser, "UPDATE_STATUS", "SESI_KELAS", session.id, {
    action: "finalize",
    absentCount: absen.length,
  });
};
