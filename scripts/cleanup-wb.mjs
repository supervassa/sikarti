/**
 * Bersihkan data Warga Belajar (WB) di Firestore + Firebase Authentication.
 *
 * Skrip lokal sekali-jalan — TIDAK di-deploy, TIDAK bagian dari aplikasi.
 * Client SDK tidak bisa menghapus akun Auth orang lain, jadi butuh Admin SDK.
 *
 * ── Persiapan ────────────────────────────────────────────────────────────────
 *  1. Firebase Console -> ⚙ Project settings -> Service accounts
 *       -> "Generate new private key" -> simpan sebagai:
 *       G:\FullStack\sikarti\serviceAccountKey.json   (sudah masuk .gitignore)
 *  2. firebase-admin sudah terpasang (devDependency).
 *
 * ── Pemakaian ────────────────────────────────────────────────────────────────
 *  node scripts/cleanup-wb.mjs                 # DRY RUN — hanya menampilkan rencana
 *  node scripts/cleanup-wb.mjs --yes           # eksekusi: hapus users kd_role 22
 *                                              #   + wbSecrets terkait + akun Auth-nya
 *  node scripts/cleanup-wb.mjs --yes --sweep   # + sapu akun Auth ber-email
 *                                              #   @wb.pkbm-kartini.local yang yatim
 *                                              #   + sisa dokumen wbSecrets
 *  node scripts/cleanup-wb.mjs --yes --test-only
 *                                              # HANYA WB uji (Nomor Induk 9999…):
 *                                              #   data asli tidak disentuh sama sekali
 *
 *  Opsi lain:
 *   --key <path>   lokasi file service account (default ./serviceAccountKey.json)
 *
 * Yang TIDAK disentuh: akun admin / superadmin / pengajar (query dibatasi kd_role == 22
 * dan domain email WB). Dengan --test-only, WB asli pun tidak disentuh — hanya yang
 * Nomor Induk-nya berawalan 9999. Skrip mencetak jumlah staf yang dipertahankan.
 *
 * PERINGATAN: penghapusan akun Auth tidak bisa dibatalkan.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const valOf = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};

const APPLY = has("--yes");
const SWEEP = has("--sweep");
const TEST_ONLY = has("--test-only");
const KEY_PATH = resolve(process.cwd(), valOf("--key", "serviceAccountKey.json"));
const WB_EMAIL_DOMAIN = "@wb.pkbm-kartini.local"; // samakan dengan src/utils/wbLogin.js
const DUMMY_PREFIX = "9999"; // Nomor Induk WB uji (samakan dengan src/utils/wbLogin.js)
const WB_KD_ROLE = 22;

const chunk = (arr, n) =>
  Array.from({ length: Math.ceil(arr.length / n) }, (_, i) =>
    arr.slice(i * n, i * n + n),
  );

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(KEY_PATH, "utf8"));
} catch {
  console.error(
    `\n✗ Tidak bisa membaca service account key di:\n  ${KEY_PATH}\n` +
      `  Unduh dari Firebase Console -> Project settings -> Service accounts.\n`,
  );
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth();
const db = getFirestore();

const banner = APPLY
  ? "=== MODE EKSEKUSI (--yes): data akan DIHAPUS ==="
  : "=== DRY RUN: tidak ada yang dihapus. Tambah --yes untuk eksekusi. ===";
console.log(`\n${banner}`);
if (TEST_ONLY) console.log(`(--test-only: HANYA WB uji, Nomor Induk ${DUMMY_PREFIX}…)`);
console.log("");

// ── 1. Kumpulkan WB dari Firestore (users kd_role == 22) ─────────────────────
const wbSnap = await db
  .collection("users")
  .where("kd_role", "==", WB_KD_ROLE)
  .get();
let wbDocs = wbSnap.docs.map((d) => ({
  uid: d.id,
  nama: d.get("nama") || "(tanpa nama)",
  email: d.get("email") || "",
  nomorInduk: String(d.get("nomorInduk") || ""),
}));
if (TEST_ONLY) {
  wbDocs = wbDocs.filter((w) => w.nomorInduk.startsWith(DUMMY_PREFIX));
}

// Pengaman: hitung staf yang TIDAK akan disentuh.
const allUsers = await db.collection("users").get();
const staff = allUsers.docs.filter((d) =>
  ["admin", "superadmin", "pengajar"].includes(d.get("role")),
);
console.log(
  `Firestore: ${wbDocs.length} dokumen WB (kd_role 22) akan dihapus.`,
);
console.log(
  `Dipertahankan: ${staff.length} akun staf (admin/superadmin/pengajar).`,
);
wbDocs.slice(0, 10).forEach((w) =>
  console.log(`  - ${w.nama}  ${w.nomorInduk || w.email}`),
);
if (wbDocs.length > 10) console.log(`  … dan ${wbDocs.length - 10} lainnya`);

// ── 2. Akun Auth milik WB tsb (berdasarkan uid) + (opsional) sapuan domain ───
const wbUidSet = new Set(wbDocs.map((w) => w.uid));
const authToDelete = new Map(); // uid -> email

for (const w of wbDocs) {
  try {
    const rec = await auth.getUser(w.uid);
    authToDelete.set(rec.uid, rec.email || w.email);
  } catch {
    /* akun Auth-nya memang sudah tidak ada — lewati */
  }
}

let sweepCount = 0;
if (SWEEP) {
  let pageToken;
  do {
    const page = await auth.listUsers(1000, pageToken);
    for (const u of page.users) {
      const email = (u.email || "").toLowerCase();
      const isWbEmail = email.endsWith(WB_EMAIL_DOMAIN);
      const matchesScope = TEST_ONLY
        ? email.startsWith(DUMMY_PREFIX)
        : true;
      if (isWbEmail && matchesScope && !wbUidSet.has(u.uid)) {
        authToDelete.set(u.uid, u.email);
        sweepCount += 1;
      }
    }
    pageToken = page.pageToken;
  } while (pageToken);
}

console.log(
  `\nFirebase Auth: ${authToDelete.size} akun akan dihapus` +
    (SWEEP ? ` (termasuk ${sweepCount} yatim ber-domain ${WB_EMAIL_DOMAIN}).` : "."),
);

if (!APPLY) {
  console.log("\nDRY RUN selesai. Tidak ada perubahan.\n");
  process.exit(0);
}

// ── 3. EKSEKUSI: hapus akun Auth ────────────────────────────────────────────
const authUids = [...authToDelete.keys()];
let authOk = 0;
let authFail = 0;
for (const batch of chunk(authUids, 1000)) {
  const res = await auth.deleteUsers(batch);
  authOk += res.successCount;
  authFail += res.failureCount;
  res.errors.forEach((e) =>
    console.warn(`  ! gagal hapus ${batch[e.index]}: ${e.error.message}`),
  );
}
console.log(`Auth: ${authOk} terhapus, ${authFail} gagal.`);

// ── 4. EKSEKUSI: hapus dokumen Firestore (users + wbSecrets) ────────────────
const fsRefs = [];
for (const w of wbDocs) {
  fsRefs.push(db.collection("users").doc(w.uid));
  fsRefs.push(db.collection("wbSecrets").doc(w.uid));
}
if (SWEEP && !TEST_ONLY) {
  const secretsSnap = await db.collection("wbSecrets").get();
  secretsSnap.docs.forEach((d) => {
    if (!wbUidSet.has(d.id)) fsRefs.push(d.ref);
  });
}
let fsCount = 0;
for (const group of chunk(fsRefs, 400)) {
  const batch = db.batch();
  group.forEach((ref) => batch.delete(ref));
  await batch.commit();
  fsCount += group.length;
}
console.log(`Firestore: ${fsCount} operasi hapus (users + wbSecrets) selesai.`);

console.log("\n✓ Pembersihan WB selesai.\n");
process.exit(0);
