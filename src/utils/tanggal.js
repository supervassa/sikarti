// Format tanggal seragam untuk tampilan. Simpanan tetap ISO "YYYY-MM-DD";
// yang berubah hanya yang dilihat pengguna -> "DD-MM-YYYY".

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

const parts = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ""));
  return m ? { y: m[1], mo: m[2], d: m[3] } : null;
};

// "2026-08-30" -> "30-08-2026". Nilai tak dikenal dikembalikan apa adanya.
export const formatTanggal = (iso, fallback = "-") => {
  const p = parts(iso);
  if (!p) return iso || fallback;
  return `${p.d}-${p.mo}-${p.y}`;
};

// "2026-08-30" -> "30 Agu 2026".
export const formatTanggalPanjang = (iso, fallback = "-") => {
  const p = parts(iso);
  if (!p) return iso || fallback;
  return `${Number(p.d)} ${MONTHS_SHORT[Number(p.mo) - 1]} ${p.y}`;
};

// Waktu relatif singkat untuk daftar notifikasi: "baru saja", "5 menit lalu",
// "2 jam lalu", "3 hari lalu". Terima epoch milidetik.
export const waktuRelatif = (ms) => {
  if (!ms) return "";
  const diff = Date.now() - ms;
  if (diff < 60_000) return "baru saja";
  const menit = Math.floor(diff / 60_000);
  if (menit < 60) return `${menit} menit lalu`;
  const jam = Math.floor(menit / 60);
  if (jam < 24) return `${jam} jam lalu`;
  const hari = Math.floor(jam / 24);
  if (hari < 7) return `${hari} hari lalu`;
  const minggu = Math.floor(hari / 7);
  if (minggu < 5) return `${minggu} minggu lalu`;
  const bulan = Math.floor(hari / 30);
  if (bulan < 12) return `${bulan} bulan lalu`;
  return `${Math.floor(hari / 365)} tahun lalu`;
};
