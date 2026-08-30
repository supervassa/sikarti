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
