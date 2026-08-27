import {
  createUserWithEmailAndPassword,
  deleteUser,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import {
  deleteField,
  doc,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../config/firebase.js";
import { getSecondaryAuth, getSecondaryDb } from "./adminManagement.js";

// Batas waktu pembayaran pendaftaran sejak formulir dikirim.
export const REGISTRATION_DEADLINE_HOURS = 48;

// Batas panjang string base64 mengikuti rule Firestore untuk media (news.mediaBase64).
const MAX_BASE64_LEN = 900000;

// Password acak sekali pakai; calon WB membuat password asli lewat tautan email.
const generateTempPassword = () => `Tmp-${crypto.randomUUID()}`;

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("File gagal dibaca."));
    reader.readAsDataURL(file);
  });

// Ubah file jadi {base64, fileName, fileType}; tolak file yang terlalu besar.
export const readFileField = async (file) => {
  if (!file) return null;
  const base64 = await fileToBase64(file);
  if (typeof base64 !== "string" || base64.length === 0) {
    throw new Error(`File "${file.name}" tidak valid.`);
  }
  if (base64.length > MAX_BASE64_LEN) {
    throw new Error(
      `Ukuran file "${file.name}" terlalu besar (maks ± 650 KB). Kompres dulu lalu coba lagi.`,
    );
  }
  return {
    base64,
    fileName: file.name || "file",
    fileType: file.type || "application/octet-stream",
  };
};

// --- COUNTDOWN HELPERS ---
export const toMillis = (ts) => {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.seconds === "number") return ts.seconds * 1000;
  return 0;
};

export const remainingMs = (deadlineAt) =>
  Math.max(0, toMillis(deadlineAt) - Date.now());

export const formatCountdown = (ms) => {
  const total = Math.floor(ms / 1000);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
};

// Pendaftaran dianggap kedaluwarsa hanya jika belum mengunggah bukti bayar.
export const isRegistrationExpired = (reg) => {
  if (!reg) return true;
  if (reg.status === "KEDALUWARSA") return true;
  return (
    reg.status === "MENUNGGU_PEMBAYARAN" && remainingMs(reg.deadlineAt) <= 0
  );
};

// --- 1. SUBMIT FORMULIR PENDAFTARAN (guest) ---
// Akun dibuat lewat app sekunder supaya sesi Auth utama (guest) tidak berubah dan
// tidak memicu race dengan onAuthStateChanged sebelum dokumen users/{uid} ditulis.
export const submitRegistration = async (form) => {
  const email = form.email.trim().toLowerCase();
  const secondaryAuth = getSecondaryAuth();
  const secondaryDb = getSecondaryDb();

  let createdUser = null;
  try {
    const credential = await createUserWithEmailAndPassword(
      secondaryAuth,
      email,
      generateTempPassword(),
    );
    createdUser = credential.user;
    const uid = createdUser.uid;
    // Pastikan token auth sekunder sudah termaterialisasi sebelum menulis Firestore.
    await createdUser.getIdToken();
    const deadlineAt = Timestamp.fromMillis(
      Date.now() + REGISTRATION_DEADLINE_HOURS * 3600 * 1000,
    );
    const namaLengkap = form.namaLengkap.trim();

    await setDoc(doc(secondaryDb, "users", uid), {
      nama: namaLengkap,
      email,
      role: "calon_wb",
      kd_role: 21,
      status: true,
      registrationId: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await setDoc(doc(secondaryDb, "registrations", uid), {
      namaLengkap,
      email,
      noHp: form.noHp.trim(),
      nik: form.nik.trim(),
      nisn: (form.nisn || "").trim(),
      tempatLahir: form.tempatLahir.trim(),
      tanggalLahir: form.tanggalLahir,
      jenisKelamin: form.jenisKelamin,
      alamat: form.alamat.trim(),
      status: "MENUNGGU_PEMBAYARAN",
      deadlineAt,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await sendPasswordResetEmail(secondaryAuth, email);
    return { uid, email };
  } catch (err) {
    // Rollback: kalau penulisan Firestore / kirim email gagal setelah akun Auth dibuat,
    // hapus akun itu supaya email tidak "nyangkut" dan pendaftar bisa mencoba lagi.
    if (createdUser) {
      await deleteUser(createdUser).catch(() => {});
    }
    throw err;
  } finally {
    await signOut(secondaryAuth).catch(() => {});
  }
};

// --- 2. UNGGAH BUKTI PEMBAYARAN (calon WB) ---
export const uploadPaymentProof = async (uid, file) => {
  const proof = await readFileField(file);
  await updateDoc(doc(db, "registrations", uid), {
    paymentProof: { ...proof, uploadedAt: Timestamp.now() },
    rejectionReason: deleteField(),
    status: "MENUNGGU_VERIFIKASI",
    updatedAt: serverTimestamp(),
  });
};

// --- 3. LENGKAPI PROFIL (calon WB, setelah pembayaran diverifikasi) ---
export const completeCalonProfile = async (uid, data) => {
  // File baru menang; jika tidak dipilih, pakai dokumen yang sudah tersimpan.
  const pasFoto =
    (await readFileField(data.pasFoto)) ||
    data.existingDokumen?.pasFoto ||
    null;
  const dokumenPendukung =
    (await readFileField(data.dokumenPendukung)) ||
    data.existingDokumen?.dokumenPendukung ||
    null;
  if (!pasFoto || !dokumenPendukung) {
    throw new Error("Pas foto dan dokumen pendukung wajib diunggah.");
  }
  const dokumen = { pasFoto, dokumenPendukung };

  await updateDoc(doc(db, "registrations", uid), {
    namaLengkap: data.namaLengkap.trim(),
    noHp: data.noHp.trim(),
    nik: data.nik.trim(),
    nisn: (data.nisn || "").trim(),
    tempatLahir: data.tempatLahir.trim(),
    tanggalLahir: data.tanggalLahir,
    jenisKelamin: data.jenisKelamin,
    alamat: data.alamat.trim(),
    namaWali: data.namaWali.trim(),
    noHpWali: data.noHpWali.trim(),
    program: data.program,
    dokumen,
    profileCompletedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

// --- 4. TANDAI KEDALUWARSA (best-effort dari client saat countdown habis) ---
export const markRegistrationExpired = async (uid) => {
  try {
    await updateDoc(doc(db, "registrations", uid), {
      status: "KEDALUWARSA",
      updatedAt: serverTimestamp(),
    });
  } catch {
    // Rule menegakkan syarat; kegagalan di sini tidak fatal untuk UI.
  }
};
