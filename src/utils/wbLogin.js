// Helper login Warga Belajar berbasis Nomor Induk.
//
// Firebase Auth tidak punya provider "username/ID", jadi Nomor Induk dipetakan
// secara deterministik ke sebuah "synthetic email" internal. Pemetaan ini murni
// operasi string di sisi client sehingga login TIDAK perlu baca Firestore dulu,
// dan duplikat Nomor Induk otomatis ditolak Firebase Auth (auth/email-already-in-use).
//
// Catatan: domain di bawah tidak perlu bisa menerima email sungguhan — Firebase
// hanya memvalidasi format RFC. Bila suatu saat ditolak (auth/invalid-email),
// ganti ke "wb.pkbm-kartini.web.app" (subdomain milik project).
export const WB_LOGIN_EMAIL_DOMAIN = "wb.pkbm-kartini.local";

// Kode paket -> 1 digit, dipakai di dalam Nomor Induk.
export const PAKET_KODE = { "Paket A": "1", "Paket B": "2", "Paket C": "3" };

// Nomor Induk WB -> email login internal. Selalu lowercase & trim.
export const buildWbLoginEmail = (nomorInduk) =>
  `${String(nomorInduk).trim().toLowerCase()}@${WB_LOGIN_EMAIL_DOMAIN}`;

// Format Nomor Induk: <YYYY><kodePaket><urut 4 digit> => total 9 digit, angka semua.
// Contoh: angkatan 2026/2027, Paket C, urutan ke-42 => "202630042".
const NOMOR_INDUK_RE = /^\d{9}$/;

export const isValidNomorInduk = (value) => NOMOR_INDUK_RE.test(String(value || "").trim());

// Ambil tahun (YYYY) dari string tahun angkatan "2026/2027" atau "2026".
const tahunAwal = (tahunAngkatan) => {
  const match = String(tahunAngkatan || "").match(/\d{4}/);
  return match ? match[0] : String(new Date().getFullYear());
};

export const nomorIndukPrefix = ({ paket, tahunAngkatan }) =>
  `${tahunAwal(tahunAngkatan)}${PAKET_KODE[paket] || "3"}`;

// Sarankan Nomor Induk berikutnya untuk kombinasi paket + tahun angkatan tertentu:
// urutan tertinggi yang sudah terpakai (dengan prefix sama) + 1, dipad 4 digit.
export const suggestNomorInduk = ({ paket, tahunAngkatan, existing = [] }) => {
  const prefix = nomorIndukPrefix({ paket, tahunAngkatan });
  let maxUrut = 0;
  for (const wb of existing) {
    const ni = String(wb?.nomorInduk || "").trim();
    if (ni.length === 9 && ni.startsWith(prefix)) {
      const urut = Number(ni.slice(5));
      if (Number.isFinite(urut) && urut > maxUrut) maxUrut = urut;
    }
  }
  return `${prefix}${String(maxUrut + 1).padStart(4, "0")}`;
};

// Password yang di-generate: 1 kata + "-" + 3 digit (2..9, hindari 0/1 yang ambigu).
// Mudah dibacakan lewat telepon & diketik ulang oleh WB. Panjang >= 6 (syarat Firebase).
const KATA_PASSWORD = [
  "melati", "mawar", "dahlia", "teratai", "kenanga",
  "cempaka", "anggrek", "bakung", "seruni", "flamboyan",
  "kamboja", "sedap", "kecubung", "wijaya", "nusa",
];

const randomInt = (max) => {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    return crypto.getRandomValues(new Uint32Array(1))[0] % max;
  }
  return Math.floor(Math.random() * max);
};

export const generateWbPassword = () => {
  const kata = KATA_PASSWORD[randomInt(KATA_PASSWORD.length)];
  let digits = "";
  for (let i = 0; i < 3; i += 1) digits += String(2 + randomInt(8));
  return `${kata}-${digits}`;
};
