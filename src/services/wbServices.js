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
import {
  buildWbProfileFields,
  createAuditLog,
  WB_OPTIONAL_FIELDS,
} from "./adminServices";
import { isInsidePresensiArea } from "../utils/presensiLokasi";
import { isValidNIK } from "../utils/wbLogin";

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

// WB menyunting profilnya sendiri (halaman Profil): biodata + paket + tahunAngkatan + nik.
// Status keanggotaan, email login, nomorInduk TIDAK ikut (dikunci di firestore.rules).
// `prevWb` = dokumen WB sebelum diedit — untuk pelihara indeks unik wbNik/{nik}.
export const updateOwnWBProfile = async (uid, form, currentUser, prevWb = {}) => {
  const prevNik = String(prevWb.nik || "").trim();
  const newNik = String(form.nik || "").trim();
  if (newNik && !isValidNIK(newNik)) {
    throw new Error("NIK harus 16 digit angka.");
  }

  // Pelihara indeks unik wbNik/{nik}. create-if-absent: kalau NIK sudah dipakai
  // WB lain, setDoc gagal -> lempar pesan yang jelas.
  if (newNik !== prevNik) {
    if (newNik) {
      try {
        await setDoc(doc(db, "wbNik", newNik), {
          uid,
          nik: newNik,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        throw new Error("NIK sudah terdaftar atas nama Warga Belajar lain.", {
          cause: err,
        });
      }
    }
    if (prevNik) {
      await deleteDoc(doc(db, "wbNik", prevNik)).catch(() => {});
    }
  }

  const optional = buildWbProfileFields(form); // biodata terisi + nisn (marker bila kosong)
  const payload = {
    nama: String(form.nama || "").trim(),
    paket: form.paket,
    tahunAngkatan: String(form.tahunAngkatan || "").trim() || deleteField(),
    updatedAt: serverTimestamp(),
    ...optional,
  };
  payload.nik = newNik || deleteField();
  // Field opsional yang dikosongkan -> hapus dari dokumen.
  for (const key of WB_OPTIONAL_FIELDS) {
    if (!(key in optional)) payload[key] = deleteField();
  }

  await updateDoc(doc(db, "users", uid), payload);
  await createAuditLog(currentUser, "UPDATE", "PROFIL_WB", uid, {
    nama: payload.nama,
  });
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
