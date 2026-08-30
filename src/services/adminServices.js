import { auth, db } from "../config/firebase";
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from "firebase/auth";
import { getSecondaryAuth } from "./adminManagement.js";
import {
  buildWbLoginEmail,
  generateWbPassword,
  isValidNIK,
} from "../utils/wbLogin.js";

const CURRENT_TAHUN_AJARAN = (() => {
  const y = new Date().getFullYear();
  return `${y}/${y + 1}`;
})();

// Antrean email mengikuti skema Firebase "Trigger Email from Firestore" extension.
// Tanpa extension terpasang, dokumen ini tidak terkirim (dormant) — bukan error.
export const queueEmail = async ({ to, subject, html }) => {
  try {
    await addDoc(collection(db, "mail"), { to, message: { subject, html } });
  } catch (err) {
    console.warn("Antrean email belum dapat ditulis:", err);
  }
};

// Password sementara acak; akun sesungguhnya diaktifkan lewat email set-password.
const generateTempPassword = () => `Tmp-${crypto.randomUUID()}`;

// Buat akun Firebase Auth + dokumen users/{uid}.
// - Default: password acak sekali pakai + kirim email set-password (dipakai Pengajar).
// - Jika `password` diberikan: dipakai apa adanya. Jika `sendResetEmail` false: email dilewati
//   (dipakai WB — kredensialnya dicetak admin, bukan lewat email).
const createAuthAccount = async ({
  nama,
  email,
  kd_role,
  role,
  status = true,
  extra = {},
  password,
  sendResetEmail = true,
}) => {
  const secondaryAuth = getSecondaryAuth();
  const cleanEmail = email.trim().toLowerCase();
  try {
    const credential = await createUserWithEmailAndPassword(
      secondaryAuth,
      cleanEmail,
      password || generateTempPassword(),
    );
    const uid = credential.user.uid;
    await setDoc(doc(db, "users", uid), {
      ...extra,
      nama,
      email: cleanEmail,
      role,
      kd_role,
      status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    if (sendResetEmail) {
      await sendPasswordResetEmail(secondaryAuth, cleanEmail);
    }
    return uid;
  } finally {
    await signOut(secondaryAuth);
  }
};

// Helper Audit Log
export const createAuditLog = async (
  actor,
  action,
  moduleName,
  targetId,
  metadata = {},
) => {
  try {
    await addDoc(collection(db, "auditLogs"), {
      action,
      module: moduleName,
      targetId,
      targetType: moduleName.toLowerCase(),
      performedBy: actor?.uid || "system",
      performedByName: actor?.nama || actor?.displayName || "Admin",
      performedByEmail: actor?.email || "",
      timestamp: serverTimestamp(),
      metadata,
    });
  } catch (err) {
    console.warn("Gagal merekam audit log:", err);
  }
};

// Update field data (bukan email/status) pada dokumen users/{id}.
const updateUserRecord = async (userId, data, actor, moduleName) => {
  await updateDoc(doc(db, "users", userId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
  await createAuditLog(actor, "UPDATE", moduleName, userId, {
    nama: data.nama,
  });
};

// Toggle status aktif/nonaktif pada dokumen users/{id}.
const toggleUserStatus = async (user, actor, moduleName) => {
  const nextStatus = !(user.status !== false);
  await updateDoc(doc(db, "users", user.id), {
    status: nextStatus,
    updatedAt: serverTimestamp(),
  });
  await createAuditLog(
    actor,
    nextStatus ? "ACTIVATE" : "DEACTIVATE",
    moduleName,
    user.id,
    { nama: user.nama },
  );
  return nextStatus;
};

// Hapus dokumen profil users/{id}. Akun Firebase Auth di baliknya tidak ikut terhapus
// (butuh Admin SDK/Cloud Function) — tapi tanpa dokumen ini, AuthContext menolak login
// ("Data pengguna tidak ditemukan di sistem"), jadi akses ke aplikasi sudah tercabut.
const deleteUserRecord = async (user, actor, moduleName) => {
  await deleteDoc(doc(db, "users", user.id));
  await createAuditLog(actor, "DELETE", moduleName, user.id, {
    nama: user.nama,
    email: user.email,
  });
};

// --- 1. MANAJEMEN WARGA BELAJAR (WB) ---
// WB login pakai Nomor Induk (angka) + password yang di-generate & dicetak admin, BUKAN email.
// Nomor Induk dipetakan ke synthetic email (buildWbLoginEmail) di balik layar.

// Field opsional WB yang, bila diisi, ikut disimpan di dokumen users/{uid}
// (harus sinkron dengan isValidWBProfileShape di firestore.rules).
export const WB_OPTIONAL_FIELDS = [
  "noHp",
  "emailKontak",
  "jenisKelamin",
  "agama",
  "tempatLahir",
  "tanggalLahir",
  "alamat",
  "sekolahAsal",
  "namaAyah",
  "namaIbu",
  "tingkat",
  "nis",
];

// Susun objek field data diri WB dari input mentah (form / impor). Kosong = tidak
// dikirim, kecuali NISN yang selalu ditulis ("NISN belum ada" bila kosong).
export const buildWbProfileFields = (dataWB) => {
  const out = {};
  for (const key of WB_OPTIONAL_FIELDS) {
    const val = dataWB[key];
    if (val != null && String(val).trim()) {
      out[key] =
        key === "emailKontak"
          ? String(val).trim().toLowerCase()
          : String(val).trim();
    }
  }
  const nisn = String(dataWB.nisn || "").trim();
  out.nisn = nisn || "NISN belum ada";
  return out;
};

export const createWB = async (dataWB, actor) => {
  const { nama, nomorInduk, paket, tahunAngkatan, nik } = dataWB;
  const ni = String(nomorInduk).trim();
  const nikClean = String(nik || "").trim();
  if (!isValidNIK(nikClean)) {
    throw new Error("NIK wajib diisi dan harus 16 digit angka.");
  }

  // Cek awal indeks NIK — mencegah akun Auth "yatim" di kasus umum. Jaminan keras
  // tetap pada penulisan wbNik/{nik} di bawah (rules menolak overwrite path yang ada).
  const nikRef = doc(db, "wbNik", nikClean);
  if ((await getDoc(nikRef)).exists()) {
    throw new Error("NIK sudah terdaftar atas nama Warga Belajar lain.");
  }

  const password = generateWbPassword();
  const extra = {
    ...buildWbProfileFields(dataWB),
    nomorInduk: ni,
    paket,
    tahunAngkatan,
    nik: nikClean,
  };

  let uid;
  try {
    uid = await createAuthAccount({
      nama,
      email: buildWbLoginEmail(ni),
      kd_role: 22,
      role: "wb",
      status: "AKTIF",
      extra,
      password,
      sendResetEmail: false,
    });
  } catch (err) {
    if (err.code === "auth/email-already-in-use") {
      throw new Error("Nomor Induk sudah dipakai Warga Belajar lain.", {
        cause: err,
      });
    }
    throw err;
  }

  // Indeks unik NIK. Penulisan ke path yang sudah ada dievaluasi sebagai "update"
  // dan ditolak rules, jadi ini penjaga keras terhadap WB dobel.
  try {
    await setDoc(nikRef, {
      uid,
      nik: nikClean,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    // NIK dobel yang lolos cek awal (mis. dua proses paralel): buang dokumen users
    // yang terlanjur dibuat. Akun Firebase Auth-nya dibersihkan lewat scripts/cleanup-wb.
    await deleteDoc(doc(db, "users", uid)).catch(() => {});
    throw new Error("NIK sudah terdaftar atas nama Warga Belajar lain.", {
      cause: err,
    });
  }

  // Simpan password supaya admin/superadmin bisa membacakannya lagi (WB lupa) & mereset.
  // Rules: wbSecrets hanya bisa diakses staff, WB tidak bisa baca miliknya sendiri.
  await setDoc(doc(db, "wbSecrets", uid), {
    pwd: password,
    nomorInduk: ni,
    updatedAt: serverTimestamp(),
  });

  await createAuditLog(actor, "CREATE", "MANAJEMEN_WB", uid, {
    nama,
    nomorInduk: ni,
  });
  return { uid, nomorInduk: ni, password };
};

// Baca password WB tersimpan — untuk dibacakan ke WB yang lupa. Staff-only via rules.
export const getWBPassword = async (wb) => {
  const snap = await getDoc(doc(db, "wbSecrets", wb.id));
  return snap.exists() ? snap.data().pwd || null : null;
};

// Reset password WB dari sisi admin. Tanpa Admin SDK, satu-satunya cara dari client:
// login sebagai WB itu di app sekunder memakai password lama (dari wbSecrets), lalu updatePassword.
export const resetWBPassword = async (wb, actor) => {
  if (!wb.nomorInduk) {
    throw new Error(
      "WB ini dibuat sebelum fitur Nomor Induk. Gunakan 'Kirim Email Reset Password'.",
    );
  }
  const secretSnap = await getDoc(doc(db, "wbSecrets", wb.id));
  const oldPwd = secretSnap.exists() ? secretSnap.data().pwd : null;
  if (!oldPwd) {
    throw new Error(
      "Password lama WB tidak tersimpan sehingga reset otomatis gagal. Hapus lalu tambah ulang WB.",
    );
  }

  const newPwd = generateWbPassword();
  const secondaryAuth = getSecondaryAuth();
  try {
    const cred = await signInWithEmailAndPassword(
      secondaryAuth,
      buildWbLoginEmail(wb.nomorInduk),
      oldPwd,
    );
    await updatePassword(cred.user, newPwd);
  } catch (err) {
    if (
      err.code === "auth/wrong-password" ||
      err.code === "auth/invalid-credential"
    ) {
      throw new Error(
        "Password tersimpan tidak cocok dengan akun login WB. Reset otomatis gagal.",
        { cause: err },
      );
    }
    throw err;
  } finally {
    await signOut(secondaryAuth).catch(() => {});
  }

  await updateDoc(doc(db, "wbSecrets", wb.id), {
    pwd: newPwd,
    updatedAt: serverTimestamp(),
  });
  await createAuditLog(actor, "UPDATE", "MANAJEMEN_WB", wb.id, {
    event: "RESET_PASSWORD",
  });
  return newPwd;
};

// Migrasi data lama: sebelum status WB jadi 3-state, field ini boolean (true/false).
export const normalizeWBStatus = (status) => {
  if (status === "AKTIF" || status === "NONAKTIF" || status === "LULUS")
    return status;
  return status === false ? "NONAKTIF" : "AKTIF";
};

// Edit data diri WB — status keanggotaan diubah lewat setWBLifecycleStatus, bukan di sini.
// Tetap sertakan status ternormalisasi supaya dokumen lama (boolean) otomatis rapi begitu diedit.
// `prevWb` = dokumen WB sebelum diedit (butuh .status & .nik untuk pelihara indeks wbNik).
export const updateWB = async (wbId, dataWB, actor, prevWb = {}) => {
  const prevNik = String(prevWb.nik || "").trim();
  const hasNikField = Object.prototype.hasOwnProperty.call(dataWB, "nik");
  const newNik = hasNikField ? String(dataWB.nik || "").trim() : prevNik;

  if (hasNikField && newNik && !isValidNIK(newNik)) {
    throw new Error("NIK harus 16 digit angka.");
  }

  // Pelihara indeks unik wbNik/{nik} bila NIK ditambahkan / diganti.
  if (newNik !== prevNik) {
    if (newNik) {
      try {
        await setDoc(doc(db, "wbNik", newNik), {
          uid: wbId,
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

  const payload = { ...dataWB, status: normalizeWBStatus(prevWb.status) };
  if (hasNikField) {
    if (newNik) payload.nik = newNik;
    else delete payload.nik;
  }
  // Rapikan field data diri opsional: kosong -> hapus dari dokumen. NISN -> marker.
  for (const key of WB_OPTIONAL_FIELDS) {
    if (key in payload && !String(payload[key] ?? "").trim()) {
      payload[key] = deleteField();
    } else if (key === "emailKontak" && typeof payload[key] === "string") {
      payload[key] = payload[key].trim().toLowerCase();
    }
  }
  if ("nisn" in payload) {
    payload.nisn = String(payload.nisn ?? "").trim() || "NISN belum ada";
  }

  await updateUserRecord(wbId, payload, actor, "MANAJEMEN_WB");
};

// Ubah status keanggotaan WB: AKTIF, NONAKTIF (catat tahun terakhir aktif), atau LULUS (catat tahun lulus).
export const setWBLifecycleStatus = async (
  { id, status, tahunLulus, terakhirAktif },
  actor,
) => {
  await updateDoc(doc(db, "users", id), {
    status,
    tahunLulus: status === "LULUS" ? tahunLulus : deleteField(),
    terakhirAktif: status === "NONAKTIF" ? terakhirAktif : deleteField(),
    updatedAt: serverTimestamp(),
  });
  await createAuditLog(actor, "UPDATE_STATUS", "MANAJEMEN_WB", id, {
    status,
    tahunLulus,
    terakhirAktif,
  });
};

export const deleteWB = async (wb, actor) => {
  await deleteDoc(doc(db, "wbSecrets", wb.id)).catch(() => {});
  if (wb.nik) {
    await deleteDoc(doc(db, "wbNik", String(wb.nik).trim())).catch(() => {});
  }
  await deleteDoc(doc(db, "wbPhotos", wb.id)).catch(() => {});
  await deleteUserRecord(wb, actor, "MANAJEMEN_WB");
};

// --- Foto WB (koleksi terpisah wbPhotos/{uid}, base64) ---
export const setWBPhoto = async (wbId, base64, actor) => {
  await setDoc(doc(db, "wbPhotos", wbId), {
    base64,
    updatedAt: serverTimestamp(),
  });
  await createAuditLog(actor, "UPDATE", "MANAJEMEN_WB", wbId, { event: "FOTO" });
};

export const deleteWBPhoto = async (wbId, actor) => {
  await deleteDoc(doc(db, "wbPhotos", wbId));
  await createAuditLog(actor, "UPDATE", "MANAJEMEN_WB", wbId, {
    event: "FOTO_HAPUS",
  });
};

// --- 2. MANAJEMEN PENGAJAR ---
export const createPengajar = async (dataPengajar, actor) => {
  const { nama, email, ...extra } = dataPengajar;
  const uid = await createAuthAccount({
    nama,
    email,
    kd_role: 33,
    role: "pengajar",
    extra,
  });
  await createAuditLog(actor, "CREATE", "MANAJEMEN_PENGAJAR", uid, { nama });
  return uid;
};

export const updatePengajar = (pengajarId, dataPengajar, actor) =>
  updateUserRecord(pengajarId, dataPengajar, actor, "MANAJEMEN_PENGAJAR");
export const setPengajarStatus = (pengajar, actor) =>
  toggleUserStatus(pengajar, actor, "MANAJEMEN_PENGAJAR");
export const deletePengajar = (pengajar, actor) =>
  deleteUserRecord(pengajar, actor, "MANAJEMEN_PENGAJAR");

// --- 3. MANAJEMEN MATA PELAJARAN ---
// Kode mapel dibuat otomatis: huruf paket + nomor urut 2 digit per paket (A01, B01, C01...).
const PAKET_KODE_PREFIX = { "Paket A": "A", "Paket B": "B", "Paket C": "C" };

const generateKodeMapel = async (paket) => {
  const prefix = PAKET_KODE_PREFIX[paket] || "X";
  const snap = await getDocs(
    query(collection(db, "subjects"), where("paket", "==", paket)),
  );
  let maxUrut = 0;
  snap.forEach((d) => {
    const match = String(d.data().kode || "").match(/^[A-Z](\d+)$/);
    if (match) maxUrut = Math.max(maxUrut, parseInt(match[1], 10));
  });
  return `${prefix}${String(maxUrut + 1).padStart(2, "0")}`;
};

export const createMapel = async (dataMapel, actor) => {
  const kode = await generateKodeMapel(dataMapel.paket);
  const docRef = await addDoc(collection(db, "subjects"), {
    ...dataMapel,
    kode,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await createAuditLog(actor, "CREATE", "MATA_PELAJARAN", docRef.id, {
    namaMapel: dataMapel.nama,
    kode,
  });
  return docRef.id;
};

export const updateMapel = async (mapelId, dataMapel, actor) => {
  const ref = doc(db, "subjects", mapelId);
  const prev = (await getDoc(ref)).data() || {};
  const payload = { ...dataMapel, updatedAt: serverTimestamp() };
  // Buatkan kode bila: mapel lama belum punya, atau paket dipindah ke paket lain
  // sehingga prefix kode tidak lagi cocok.
  const prefix = PAKET_KODE_PREFIX[dataMapel.paket] || "X";
  if (!prev.kode || !String(prev.kode).startsWith(prefix)) {
    payload.kode = await generateKodeMapel(dataMapel.paket);
  }
  await updateDoc(ref, payload);
  await createAuditLog(actor, "UPDATE", "MATA_PELAJARAN", mapelId, {
    namaMapel: dataMapel.nama,
    kode: payload.kode || prev.kode || "",
  });
};

export const deleteMapel = async (mapelId, actor) => {
  await deleteDoc(doc(db, "subjects", mapelId));
  await createAuditLog(actor, "DELETE", "MATA_PELAJARAN", mapelId);
};

// --- 4. MANAJEMEN BERITA / KONTEN ---

// Bagian media dokumen berita sesuai tipe: video / gambar-upload / gambar-url.
const beritaMediaPayload = ({
  tipeMedia,
  mediaType,
  mediaUrl,
  mediaBase64,
}) => {
  if (tipeMedia === "video") return { mediaUrl };
  if (mediaType === "upload") return { mediaType, mediaBase64 };
  return { mediaType, mediaUrl };
};

export const createBerita = async (dataBerita, actor) => {
  const { title, deskripsi, tipeMedia } = dataBerita;
  const docRef = await addDoc(collection(db, "news"), {
    title,
    deskripsi,
    tipeMedia,
    ...beritaMediaPayload(dataBerita),
    author: actor?.nama || actor?.displayName || "Admin",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await createAuditLog(actor, "CREATE", "BERITA", docRef.id, { title });
  return docRef.id;
};

export const updateBerita = async (beritaId, dataBerita, actor) => {
  const { title, deskripsi, tipeMedia } = dataBerita;
  const media = beritaMediaPayload(dataBerita);
  await updateDoc(doc(db, "news", beritaId), {
    title,
    deskripsi,
    tipeMedia,
    updatedAt: serverTimestamp(),
    // Field media yang tidak lagi dipakai dihapus supaya lolos validasi rules.
    mediaUrl: "mediaUrl" in media ? media.mediaUrl : deleteField(),
    mediaType: "mediaType" in media ? media.mediaType : deleteField(),
    mediaBase64: "mediaBase64" in media ? media.mediaBase64 : deleteField(),
  });
  await createAuditLog(actor, "UPDATE", "BERITA", beritaId, { title });
};

export const deleteBerita = async (beritaId, actor) => {
  await deleteDoc(doc(db, "news", beritaId));
  await createAuditLog(actor, "DELETE", "BERITA", beritaId);
};

// --- 5. PENDAFTAR CALON WB: verifikasi bayar → lengkapi profil → aktivasi ---

// Admin meng-ACC bukti pembayaran → countdown berhenti, calon lanjut lengkapi profil.
export const verifyRegistrationPayment = async (regId, actor) => {
  await updateDoc(doc(db, "registrations", regId), {
    status: "LUNAS",
    paymentVerifiedBy: actor?.uid || "system",
    paymentVerifiedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await createAuditLog(actor, "UPDATE_STATUS", "PENDAFTARAN", regId, {
    status: "LUNAS",
  });
};

// Admin menolak bukti bayar → status balik ke MENUNGGU_PEMBAYARAN, countdown lanjut.
export const rejectRegistrationPayment = async (regId, reason, actor) => {
  await updateDoc(doc(db, "registrations", regId), {
    status: "MENUNGGU_PEMBAYARAN",
    paymentProof: deleteField(),
    rejectionReason: (reason || "Bukti pembayaran tidak valid.").slice(0, 300),
    updatedAt: serverTimestamp(),
  });
  await createAuditLog(actor, "UPDATE_STATUS", "PENDAFTARAN", regId, {
    status: "TOLAK_BAYAR",
  });
};

// Admin menolak pendaftaran sepenuhnya.
export const rejectRegistration = async (regId, reason, actor) => {
  await updateDoc(doc(db, "registrations", regId), {
    status: "DITOLAK",
    rejectionReason: (reason || "Pendaftaran ditolak.").slice(0, 300),
    updatedAt: serverTimestamp(),
  });
  await createAuditLog(actor, "UPDATE_STATUS", "PENDAFTARAN", regId, {
    status: "DITOLAK",
  });
};

// Aktivasi: users/{uid} calon_wb → wb (uid & login tetap sama), registrations ditutup.
export const activateCalonWB = async (registration, actor) => {
  const uid = registration.id;

  await updateDoc(doc(db, "users", uid), {
    nama: registration.namaLengkap,
    email: registration.email,
    role: "wb",
    kd_role: 22,
    status: "AKTIF",
    paket: registration.program,
    tahunAngkatan: CURRENT_TAHUN_AJARAN,
    nik: registration.nik || "",
    noHp: registration.noHp || "",
    registrationId: deleteField(),
    updatedAt: serverTimestamp(),
  });

  await updateDoc(doc(db, "registrations", uid), {
    status: "DIAKTIFKAN",
    activatedBy: actor?.uid || "system",
    activatedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await createAuditLog(actor, "ACTIVATE", "MANAJEMEN_WB", uid, {
    nama: registration.namaLengkap,
  });
  await queueEmail({
    to: registration.email,
    subject: "Akun Warga Belajar PKBM KARTINI telah aktif",
    html:
      `<p>Halo ${registration.namaLengkap},</p>` +
      `<p>Akun Warga Belajar Anda di PKBM KARTINI sudah diaktifkan. Silakan login memakai email ` +
      `<b>${registration.email}</b> dan password yang telah Anda buat. Jika lupa password, gunakan menu ` +
      `"Lupa password?" di halaman login.</p>`,
  });
};

// Admin/Superadmin kirim tautan reset password untuk WB / Pengajar.
export const resetUserPassword = async (user, actor, moduleName) => {
  const email = (user.email || "").trim().toLowerCase();
  await sendPasswordResetEmail(auth, email);
  await createAuditLog(actor, "UPDATE", moduleName, user.id, {
    event: "RESET_PASSWORD",
  });
  await queueEmail({
    to: email,
    subject: "Reset password akun PKBM KARTINI",
    html:
      "<p>Admin membuat permintaan reset password untuk akun Anda. Cek email dari Firebase " +
      "untuk tautan pembuatan password baru.</p>",
  });
};

// --- 6. MANAJEMEN JADWAL ---
export const createJadwal = async (dataJadwal, actor) => {
  const docRef = await addDoc(collection(db, "schedules"), {
    ...dataJadwal,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await createAuditLog(actor, "CREATE", "JADWAL", docRef.id, {
    hari: dataJadwal.hari,
    mapel: dataJadwal.namaMapel,
  });
  return docRef.id;
};

export const updateJadwal = async (jadwalId, dataJadwal, actor) => {
  await updateDoc(doc(db, "schedules", jadwalId), {
    ...dataJadwal,
    updatedAt: serverTimestamp(),
  });
  await createAuditLog(actor, "UPDATE", "JADWAL", jadwalId, {
    hari: dataJadwal.hari,
    mapel: dataJadwal.namaMapel,
  });
};

export const deleteJadwal = async (jadwalId, actor) => {
  await deleteDoc(doc(db, "schedules", jadwalId));
  await createAuditLog(actor, "DELETE", "JADWAL", jadwalId);
};

// --- 7. REKAP KEHADIRAN ---
export const recordPresensi = async (dataPresensi, actor) => {
  const docRef = await addDoc(collection(db, "presensi"), {
    ...dataPresensi,
    recordedBy: actor?.uid || "system",
    createdAt: serverTimestamp(),
  });
  await createAuditLog(actor, "CREATE", "PRESENSI", docRef.id, {
    nama: dataPresensi.nama,
    status: dataPresensi.status,
  });
  return docRef.id;
};

export const deletePresensi = async (presensiId, actor, meta = {}) => {
  await deleteDoc(doc(db, "presensi", presensiId));
  await createAuditLog(actor, "DELETE", "PRESENSI", presensiId, meta);
};

export const deleteSesiKelas = async (sessionId, actor, meta = {}) => {
  await deleteDoc(doc(db, "classSessions", sessionId));
  await createAuditLog(actor, "DELETE", "CLASS_SESSION", sessionId, meta);
};

// --- 8. INFORMASI TAGIHAN ---
export const createTagihan = async (dataTagihan, actor) => {
  const docRef = await addDoc(collection(db, "invoices"), {
    ...dataTagihan,
    status: dataTagihan.status || "BELUM_LUNAS",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await createAuditLog(actor, "CREATE", "TAGIHAN", docRef.id, {
    nama: dataTagihan.nama,
    jumlah: dataTagihan.jumlah,
  });
  return docRef.id;
};

export const updateTagihanStatus = async (tagihanId, status, actor) => {
  await updateDoc(doc(db, "invoices", tagihanId), {
    status,
    updatedAt: serverTimestamp(),
  });
  await createAuditLog(actor, "UPDATE_STATUS", "TAGIHAN", tagihanId, {
    status,
  });
};

// --- 9. MANAJEMEN TUGAS ---
// Tugas menempel pada satu mapel; input inti judul + link file Google Drive.
// mapelNama & paket didenormalisasi dari subjects saat pemanggil menyusun payload.
export const createTugas = async (dataTugas, actor) => {
  const docRef = await addDoc(collection(db, "tugas"), {
    mapelId: dataTugas.mapelId,
    mapelNama: dataTugas.mapelNama,
    paket: dataTugas.paket,
    judul: dataTugas.judul.trim(),
    linkFile: dataTugas.linkFile.trim(),
    author: actor?.nama || actor?.displayName || "Admin",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await createAuditLog(actor, "CREATE", "TUGAS", docRef.id, {
    judul: dataTugas.judul,
    mapel: dataTugas.mapelNama,
  });
  return docRef.id;
};

export const updateTugas = async (tugasId, dataTugas, actor) => {
  await updateDoc(doc(db, "tugas", tugasId), {
    mapelId: dataTugas.mapelId,
    mapelNama: dataTugas.mapelNama,
    paket: dataTugas.paket,
    judul: dataTugas.judul.trim(),
    linkFile: dataTugas.linkFile.trim(),
    updatedAt: serverTimestamp(),
  });
  await createAuditLog(actor, "UPDATE", "TUGAS", tugasId, {
    judul: dataTugas.judul,
    mapel: dataTugas.mapelNama,
  });
};

export const deleteTugas = async (tugasId, actor) => {
  await deleteDoc(doc(db, "tugas", tugasId));
  await createAuditLog(actor, "DELETE", "TUGAS", tugasId);
};
