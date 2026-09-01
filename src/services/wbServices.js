import { db } from "../config/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { createAuditLog, WB_SELF_EDITABLE_FIELDS } from "./adminServices";
import { isInsidePresensiArea } from "../utils/presensiLokasi";

export const todayISO = () => new Date().toISOString().slice(0, 10);

// Sudah presensi untuk sesi kelas tertentu (bukan "sudah presensi hari ini" secara umum —
// satu WB bisa punya beberapa jadwal/sesi berbeda di hari yang sama).
export const hasCheckedInForSession = async (uid, sessionId) => {
  const q = query(
    collection(db, "presensi"),
    where("wbId", "==", uid),
    where("sessionId", "==", sessionId),
  );
  const snap = await getDocs(q);
  return !snap.empty;
};

// Presensi mandiri WB: hanya bisa selama sesi kelas (classSessions) masih aktif — lihat
// firestore.rules isClassSessionActive. Wajib foto+lokasi dari CaptureAttendanceModal.
// mode "luring" mewajibkan lokasi di area PKBM (ditegakkan ulang di firestore.rules).
export const checkinPresensi = async (
  currentUser,
  session,
  { fotoBase64, lokasi, mode = "luring" },
) => {
  const presensiMode = mode === "daring" ? "daring" : "luring";
  if (presensiMode === "luring" && !isInsidePresensiArea(lokasi)) {
    throw new Error("Anda tidak di lokasi presensi");
  }
  const docRef = await addDoc(collection(db, "presensi"), {
    wbId: currentUser.uid,
    nama: currentUser.nama,
    status: "Hadir",
    tanggal: todayISO(),
    sessionId: session.id,
    namaMapel: session.namaMapel,
    lokasi,
    fotoBase64,
    mode: presensiMode,
    recordedBy: currentUser.uid,
    createdAt: serverTimestamp(),
  });
  await createAuditLog(currentUser, "CREATE", "PRESENSI", docRef.id, {
    nama: currentUser.nama,
    status: "Hadir",
    selfCheckin: true,
  });
  return docRef.id;
};

// WB hanya boleh ubah nomor HP sendiri (lihat firestore.rules: isValidSelfContactUpdate).
export const updateOwnContact = async (uid, noHp, currentUser) => {
  await updateDoc(doc(db, "users", uid), {
    noHp,
    updatedAt: serverTimestamp(),
  });
  await createAuditLog(currentUser, "UPDATE", "PROFIL_WB", uid, { noHp });
};

// WB menyunting profilnya sendiri (halaman Profil). Hanya field biodata yang boleh
// diubah WB (WB_SELF_EDITABLE_FIELDS). NISN, NIK, Program Paket, Tahun Angkatan,
// Tingkat/Kelas, status, email login, nomorInduk DIKUNCI — hanya admin yang bisa
// (ditegakkan ulang di firestore.rules isValidWBSelfProfileUpdate).
export const updateOwnWBProfile = async (uid, form, currentUser) => {
  const nama = String(form.nama || "").trim();
  if (nama.length < 2) {
    throw new Error("Nama tidak boleh kosong.");
  }

  const payload = { nama, updatedAt: serverTimestamp() };
  for (const key of WB_SELF_EDITABLE_FIELDS) {
    if (key === "nama") continue;
    const val = form[key] == null ? "" : String(form[key]).trim();
    if (!val) {
      payload[key] = deleteField();
    } else {
      payload[key] = key === "emailKontak" ? val.toLowerCase() : val;
    }
  }

  await updateDoc(doc(db, "users", uid), payload);
  await createAuditLog(currentUser, "UPDATE", "PROFIL_WB", uid, { nama });
};

// Foto WB (wbPhotos/{uid}, base64). WB kelola fotonya sendiri di halaman Profil.
export const setOwnWBPhoto = async (uid, base64, currentUser) => {
  await setDoc(doc(db, "wbPhotos", uid), {
    base64,
    updatedAt: serverTimestamp(),
  });
  await createAuditLog(currentUser, "UPDATE", "PROFIL_WB", uid, { event: "FOTO" });
};

export const deleteOwnWBPhoto = async (uid, currentUser) => {
  await deleteDoc(doc(db, "wbPhotos", uid));
  await createAuditLog(currentUser, "UPDATE", "PROFIL_WB", uid, {
    event: "FOTO_HAPUS",
  });
};
