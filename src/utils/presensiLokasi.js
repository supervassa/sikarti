// Batas lokasi presensi LURING — area PKBM (SDN Tempurejo 5), dari 5 titik yang
// diberikan lembaga. Disederhanakan jadi rentang lat/long (bounding box) + toleransi
// GPS. Angka yang sama (setelah toleransi) ditegakkan ulang di firestore.rules
// (isValidSelfCheckinDoc) — jika diubah di sini, ubah juga di sana.
//
// Titik asli:
//   8°18'21.61"S 113°41'13.71"E   8°18'21.99"S 113°41'15.00"E
//   8°18'23.65"S 113°41'14.53"E   8°18'23.21"S 113°41'13.20"E
//   8°18'22.70"S 113°41'14.15"E
export const PRESENSI_LURING_BOUNDS = {
  latMin: -8.3065694,
  latMax: -8.3060028,
  lngMin: 113.687,
  lngMax: 113.6875,
};

// ± ~16 m — kompensasi akurasi GPS ponsel di dekat bangunan.
export const GEO_TOLERANCE_DEG = 0.00015;

export const isInsidePresensiArea = (loc) => {
  const lat = loc?.lat;
  const lng = loc?.lng;
  if (typeof lat !== "number" || typeof lng !== "number") return false;
  const b = PRESENSI_LURING_BOUNDS;
  return (
    lat >= b.latMin - GEO_TOLERANCE_DEG &&
    lat <= b.latMax + GEO_TOLERANCE_DEG &&
    lng >= b.lngMin - GEO_TOLERANCE_DEG &&
    lng <= b.lngMax + GEO_TOLERANCE_DEG
  );
};
