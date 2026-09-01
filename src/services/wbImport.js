// Impor Warga Belajar dari file Excel. Format didukung otomatis:
//  - "dapodik"   : ekspor Dapodik "Daftar Peserta Didik" — data lengkap (NIK, NISN,
//                  TTL, alamat, agama, ortu, rombel/tingkat, sekolah asal, dst).
//  - "template"  : file rapi hasil "Unduh Template" (kolom: Nama, NIK, Paket, Tahun Angkatan)
//  - "mentah"    : sheet "PAKET ABC" dari data dinas lama (tanpa NIK — dianggap usang).
// Memakai alur createWB: tiap WB dapat Nomor Induk + password ter-generate, dokumen
// users/{uid} + wbNik/{nik} + wbSecrets/{uid}. NIK wajib untuk semua WB baru.
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase.js";
import { createWB, deleteWB } from "./adminServices.js";
import {
  isValidNIK,
  nomorIndukPrefix,
  suggestNomorInduk,
} from "../utils/wbLogin.js";

export const IMPORT_TAHUN_ANGKATAN = "2026/2027";
export const SHEET_DEFAULT = "PAKET ABC";
export const TEMPLATE_SHEET = "Data WB";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SECTION_RE = /DAFTAR\s+WARGA\s+BELAJAR.*PAKET\s+([ABC])/i;
const BERHENTI_RE =
  /berhenti|tidak\s*aktif|tdk\s*aktif|tdk\s*respon|tidak\s*respon|tdk\s*d(a|f)tar|tidak\s*daftar|hanya\s*data|\?\?\?/i;
const BELUM_RE = /belum\s*daftar/i;
const CONTOH_RE = /^\(?contoh\b/i;

const normalizePaket = (v) => {
  const s = String(v ?? "")
    .trim()
    .toUpperCase()
    .replace(/^PAKET\s*/, "");
  if (s === "A") return "Paket A";
  if (s === "B") return "Paket B";
  if (s === "C") return "Paket C";
  return null;
};

const cleanNama = (v) =>
  String(v ?? "")
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\?+/g, "")
    .replace(/\s+/g, " ")
    .trim();

// Nama Dapodik kerap HURUF BESAR semua ("ADI WIJAYA") — jadikan Title Case.
// String yang sudah ada huruf kecilnya ("Abdul Azis") dibiarkan.
const tidyNama = (v) => {
  const s = String(v ?? "").replace(/\s+/g, " ").trim();
  if (s && s === s.toUpperCase()) {
    return s
      .toLowerCase()
      .replace(/(^|\s|['-])([a-z])/g, (_, p, c) => p + c.toUpperCase());
  }
  return s;
};

const digits = (v) => String(v ?? "").replace(/\D/g, "");
const blankIfSpaces = (v) => {
  const s = String(v ?? "").trim();
  return s || "";
};

// "Kelas 11" / "Kelas VII" / "11" -> "11" (tingkat sebagai angka string).
const ROMAN = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10, xi: 11, xii: 12 };
const parseTingkat = (v) => {
  const s = String(v ?? "").trim();
  const num = s.match(/\d{1,2}/);
  if (num) return num[0];
  const rom = s.replace(/kelas\s*/i, "").trim().toLowerCase();
  return ROMAN[rom] ? String(ROMAN[rom]) : "";
};

// Tingkat -> Paket kesetaraan. 1–6 = A (SD), 7–9 = B (SMP), 10–12 = C (SMA).
const paketFromTingkat = (tingkat) => {
  const n = Number(tingkat);
  if (n >= 1 && n <= 6) return "Paket A";
  if (n >= 7 && n <= 9) return "Paket B";
  if (n >= 10 && n <= 12) return "Paket C";
  return null;
};

// Normalisasi tanggal lahir -> "YYYY-MM-DD" (dipakai <input type=date> & rules).
// Data dinas kerap campur aduk: "07/04/2009", "6/7/1983", "14 Mei 2007",
// "10/12/ 1981", "01/011986", serial Excel, dll. Fungsi ini toleran; kalau
// benar-benar tak terbaca -> "" (baris ditandai, bukan gagal).
const serialToISO = (n) => {
  const d = new Date(Math.round((n - 25569) * 86400 * 1000));
  return isNaN(d) ? "" : d.toISOString().slice(0, 10);
};

const MONTHS = {
  jan: 1, januari: 1, feb: 2, februari: 2, mar: 3, maret: 3, march: 3,
  apr: 4, april: 4, mei: 5, may: 5, jun: 6, juni: 6, june: 6,
  jul: 7, juli: 7, july: 7, agu: 8, agt: 8, agus: 8, agustus: 8, aug: 8, august: 8,
  sep: 9, sept: 9, september: 9, okt: 10, oct: 10, oktober: 10, october: 10,
  nov: 11, nop: 11, november: 11, nopember: 11,
  des: 12, dec: 12, desember: 12, december: 12,
};

// Tahun 2 digit -> 4 digit. Pivot: <= (tahun ini %100 + 5) dianggap 20xx.
const fullYear = (y) => {
  const n = Number(y);
  if (String(y).length >= 4) return n;
  const pivot = (new Date().getFullYear() % 100) + 5;
  return n <= pivot ? 2000 + n : 1900 + n;
};

const buildISO = (y, m, d) => {
  const yy = fullYear(y);
  if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && yy >= 1900 && yy <= 2100) {
    return `${yy}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  return "";
};

// dd & mm ambigu -> pakai yang > 12 sebagai hari; kalau dua-duanya <= 12 asumsi D/M.
const dayMonth = (a, b) => {
  if (a > 12 && b <= 12) return [a, b];
  if (b > 12 && a <= 12) return [b, a];
  return [a, b];
};

const toISODate = (v) => {
  if (v == null || v === "") return "";
  if (v instanceof Date && !isNaN(v)) return v.toISOString().slice(0, 10);
  if (typeof v === "number" && isFinite(v)) return serialToISO(v);

  // Rapikan: buang bagian jam, rapatkan spasi.
  const s = String(v)
    .trim()
    .replace(/[T ]\d{1,2}[:.]\d{2}(:\d{2})?.*$/, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!s) return "";

  // YYYY-MM-DD / YYYY.MM.DD / YYYY/MM/DD
  let m = s.match(/^(\d{4})[/.\- ](\d{1,2})[/.\- ](\d{1,2})$/);
  if (m) return buildISO(m[1], +m[2], +m[3]);

  // Serial Excel sebagai teks (mis. "31500").
  if (/^\d{4,5}(\.\d+)?$/.test(s)) return serialToISO(Number(s));

  // "14 Mei 2007" / "14-Mar-98" / "14/September/1990"
  m = s.match(/^(\d{1,2})[ /.-]+([A-Za-z]+)[ /.-]+(\d{2,4})$/);
  if (m && MONTHS[m[2].toLowerCase()]) {
    return buildISO(m[3], MONTHS[m[2].toLowerCase()], +m[1]);
  }
  // "Mei 14, 2007" / "March 14 2007"
  m = s.match(/^([A-Za-z]+)[ ,./-]+(\d{1,2})[ ,./-]+(\d{2,4})$/);
  if (m && MONTHS[m[1].toLowerCase()]) {
    return buildISO(m[3], MONTHS[m[1].toLowerCase()], +m[2]);
  }

  // dd?/mm?/yy(yy) — pemisah / . - atau spasi (menampung "10/12/ 1981").
  m = s.match(/^(\d{1,2})[ /.-]+(\d{1,2})[ /.-]+(\d{2,4})$/);
  if (m) {
    const [d, mo] = dayMonth(+m[1], +m[2]);
    return buildISO(m[3], mo, d);
  }

  // Typo tanpa pemisah kedua: "01/011986" -> hari=01, "011986" = mm + yyyy.
  m = s.match(/^(\d{1,2})[ /.-](\d{5,6})$/);
  if (m) {
    const blob = m[2];
    return buildISO(blob.slice(-4), +blob.slice(0, blob.length - 4), +m[1]);
  }

  // 8 digit rapat: 19860407 (yyyymmdd) atau 07041986 (ddmmyyyy).
  m = s.match(/^(\d{8})$/);
  if (m) {
    const g = m[1];
    if (/^(19|20)/.test(g)) return buildISO(g.slice(0, 4), +g.slice(4, 6), +g.slice(6, 8));
    const [d, mo] = dayMonth(+g.slice(0, 2), +g.slice(2, 4));
    return buildISO(g.slice(4), mo, d);
  }

  return "";
};

const jkFull = (v) => {
  const s = String(v ?? "").trim().toUpperCase();
  if (s === "L" || s.startsWith("LAKI")) return "Laki-laki";
  if (s === "P" || s.startsWith("PEREMPUAN")) return "Perempuan";
  return "";
};

// --- 1. BACA FILE ---
export const parseWorkbook = async (file) => {
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const workbook = XLSX.read(buf, { type: "array" });
  return { workbook, sheetNames: workbook.SheetNames, XLSX };
};

// --- 2. UNDUH TEMPLATE KOSONG ---
// Kolom mengikuti field pada form Data Diri WB, jadi admin bisa langsung
// menyalin kolom dari ekspor Dapodik ke sini lalu impor.
const TEMPLATE_HEADERS = [
  "Nama",
  "NIK",
  "NISN",
  "Jenis Kelamin",
  "Agama",
  "Tempat Lahir",
  "Tanggal Lahir",
  "Alamat",
  "No HP",
  "Email Kontak",
  "Sekolah Asal",
  "Nama Ayah",
  "Nama Ibu",
  "Tingkat",
  "Paket",
  "Tahun Angkatan",
];

export const downloadTemplate = async () => {
  const XLSX = await import("xlsx");
  const contoh = [
    "Contoh - Siti Aminah",
    "3509010101010001",
    "0087654321",
    "Perempuan",
    "Islam",
    "Jember",
    "2007-05-14",
    "Dsn. Krajan RT 1 RW 2, Ds. Tempurejo, Kec. Tempurejo",
    "081234567890",
    "",
    "SMPN 1 Tempurejo",
    "Sukardi",
    "Aminah",
    "10",
    "Paket C",
    IMPORT_TAHUN_ANGKATAN,
  ];
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, contoh]);
  ws["!cols"] = TEMPLATE_HEADERS.map((h) => ({
    wch: Math.max(12, h.length + 4),
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, TEMPLATE_SHEET);
  XLSX.writeFile(wb, "template-impor-wb.xlsx");
};

// --- 3. PARSE SATU SHEET (auto: dapodik / template / mentah) ---
// Balik: { format, rows: [{ no, nama, nik, paket, tahunAngkatan, flags, ...dataDiri }] }
export const parseSheet = (workbook, XLSX, sheetName) => {
  const ws = workbook.Sheets[sheetName];
  if (!ws) return { format: "mentah", rows: [] };
  const grid = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    raw: true,
    blankrows: false,
  });

  // Dapodik: ada baris header yang memuat "NIPD" + "NISN".
  const dapodikHeaderIdx = grid.findIndex(
    (r) =>
      r.some((c) => typeof c === "string" && /^nipd$/i.test(c.trim())) &&
      r.some((c) => typeof c === "string" && /^nisn$/i.test(c.trim())),
  );
  if (dapodikHeaderIdx >= 0) {
    const textGrid = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      raw: false,
      blankrows: false,
    });
    return {
      format: "dapodik",
      rows: parseDapodikGrid(textGrid, dapodikHeaderIdx),
    };
  }

  const headerRowIdx = grid.findIndex((r) =>
    r.some((c) => typeof c === "string" && /^nama$/i.test(c.trim())),
  );
  const looksTemplate =
    headerRowIdx >= 0 &&
    grid[headerRowIdx].some(
      (c) => typeof c === "string" && /paket/i.test(c.trim()),
    );

  if (looksTemplate) {
    // raw:false -> NIK/NISN tidak kena presisi float, tanggal tetap dinormalisasi.
    const textGrid = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      raw: false,
      blankrows: false,
    });
    return { format: "template", rows: parseTemplateGrid(textGrid, headerRowIdx) };
  }
  return { format: "mentah", rows: parseMentahGrid(grid) };
};

// Template rapi — kolom mengikuti form Data Diri WB (lihat TEMPLATE_HEADERS).
const parseTemplateGrid = (grid, headerRowIdx) => {
  const header = grid[headerRowIdx].map((c) =>
    String(c ?? "").trim().toLowerCase(),
  );
  const col = (test) => header.findIndex(test);
  const i = {
    nama: col((h) => h === "nama" || h === "nama lengkap"),
    nik: col((h) => h === "nik"),
    nisn: col((h) => h === "nisn"),
    jk: col((h) => h.includes("kelamin") || h === "jk"),
    agama: col((h) => h === "agama"),
    tempatLahir: col((h) => h.includes("tempat lahir")),
    tglLahir: col((h) => h.includes("tanggal lahir") || h.includes("tgl lahir")),
    alamat: col((h) => h === "alamat" || h.startsWith("alamat")),
    hp: col((h) => h.includes("hp") || h.includes("telepon") || h.includes("telp")),
    email: col((h) => h.includes("email") || h.includes("e-mail")),
    sekolahAsal: col((h) => h.includes("sekolah asal") || h.includes("asal sekolah")),
    ayah: col((h) => h.includes("ayah")),
    ibu: col((h) => h.includes("ibu")),
    tingkat: col((h) => h.includes("tingkat") || h.includes("kelas") || h.includes("rombel")),
    paket: col((h) => h.includes("paket")),
    tahun: col((h) => h.includes("tahun") || h.includes("angkatan")),
  };
  const at = (raw, idx) => (idx >= 0 ? blankIfSpaces(raw[idx]) : "");

  const rows = [];
  const seen = new Set();
  for (let r = headerRowIdx + 1; r < grid.length; r += 1) {
    const raw = grid[r] || [];
    const nama = cleanNama(raw[i.nama]);
    if (!nama) continue;

    const nik = i.nik >= 0 ? digits(raw[i.nik]) : "";
    const tingkat = parseTingkat(at(raw, i.tingkat));
    const paketCol = normalizePaket(raw[i.paket]);
    const paket = paketCol || paketFromTingkat(tingkat) || "Paket C";
    const tahunAngkatan = at(raw, i.tahun) || IMPORT_TAHUN_ANGKATAN;
    const email = at(raw, i.email).toLowerCase();
    const tglLahirRaw = at(raw, i.tglLahir);
    const tanggalLahir = toISODate(raw[i.tglLahir]);

    const flags = [];
    if (CONTOH_RE.test(nama)) flags.push("contoh");
    if (!paketCol && !paketFromTingkat(tingkat)) flags.push("paket-invalid");
    if (!isValidNIK(nik)) flags.push("nik-kosong");
    if (i.tingkat >= 0 && !tingkat) flags.push("tingkat-kosong");
    if (tglLahirRaw && !tanggalLahir) flags.push("tgl-invalid");
    const key = nik || `${paket}|${nama.toLowerCase()}`;
    if (seen.has(key)) flags.push("duplikat");
    seen.add(key);

    rows.push({
      no: r,
      nama,
      nik,
      nisn: i.nisn >= 0 ? digits(raw[i.nisn]) : "",
      jenisKelamin: jkFull(at(raw, i.jk)),
      agama: at(raw, i.agama),
      tempatLahir: at(raw, i.tempatLahir),
      tanggalLahir,
      tanggalLahirRaw: tglLahirRaw,
      alamat: at(raw, i.alamat).slice(0, 300),
      noHp: digits(at(raw, i.hp)),
      emailKontak: email.includes("@") ? email : "",
      sekolahAsal: at(raw, i.sekolahAsal),
      namaAyah: tidyNama(at(raw, i.ayah)),
      namaIbu: tidyNama(at(raw, i.ibu)),
      tingkat,
      paket,
      tahunAngkatan,
      flags,
    });
  }
  return rows;
};

// Sheet "PAKET ABC" lama (tanpa NIK) — semua baris dikunci; pakai ekspor Dapodik.
const parseMentahGrid = (grid) => {
  const rows = [];
  const seen = new Set();
  let currentPaket = null;

  for (const raw of grid) {
    const a = raw[0];
    const b = raw[1];

    if (typeof a === "string" && SECTION_RE.test(a)) {
      currentPaket = `Paket ${SECTION_RE.exec(a)[1].toUpperCase()}`;
      continue;
    }
    if (typeof a !== "number") continue;
    if (typeof b !== "string" || !b.trim()) continue;
    if (!currentPaket) continue;

    const namaAsli = b.trim();
    const nama = cleanNama(namaAsli);
    if (!nama) continue;

    const flags = ["nik-kosong"];
    if (BERHENTI_RE.test(namaAsli)) flags.push("kemungkinan-berhenti");
    if (BELUM_RE.test(namaAsli)) flags.push("belum-daftar");
    const key = `${currentPaket}|${nama.toLowerCase()}`;
    if (seen.has(key)) flags.push("duplikat");
    seen.add(key);

    rows.push({
      no: a,
      nama,
      nik: "",
      paket: currentPaket,
      tahunAngkatan: IMPORT_TAHUN_ANGKATAN,
      flags,
    });
  }
  return rows;
};

// Ekspor Dapodik "Daftar Peserta Didik". Kolom dipetakan berdasar nama header
// (bukan indeks tetap) karena blok "Data Ayah/Ibu/Wali" ter-merge.
const parseDapodikGrid = (grid, headerIdx) => {
  const header = grid[headerIdx].map((c) => String(c ?? "").trim());
  const find = (re) => header.findIndex((h) => re.test(h));
  const col = {
    nama: find(/^nama$/i),
    nipd: find(/^nipd$/i),
    jk: find(/^jk$/i),
    nisn: find(/^nisn$/i),
    tempatLahir: find(/tempat lahir/i),
    tglLahir: find(/tanggal lahir/i),
    nik: find(/^nik$/i),
    agama: find(/^agama$/i),
    alamat: find(/^alamat$/i),
    rt: find(/^rt$/i),
    rw: find(/^rw$/i),
    dusun: find(/^dusun$/i),
    kelurahan: find(/kelurahan|^desa$/i),
    kecamatan: find(/^kecamatan$/i),
    kodePos: find(/kode pos/i),
    telepon: find(/^telepon$/i),
    hp: find(/^hp$/i),
    email: find(/e-?mail/i),
    rombel: find(/rombel/i),
    sekolahAsal: find(/sekolah asal/i),
    ayahNama: header.indexOf("Data Ayah"),
    ibuNama: header.indexOf("Data Ibu"),
  };

  const at = (raw, i) => (i >= 0 ? blankIfSpaces(raw[i]) : "");
  const rows = [];
  const seen = new Set();

  for (let r = headerIdx + 1; r < grid.length; r += 1) {
    const raw = grid[r] || [];
    const namaRaw = at(raw, col.nama);
    if (!namaRaw || /^nama$/i.test(namaRaw)) continue; // lewati sub-header / baris kosong

    const nama = tidyNama(namaRaw);
    const nik = digits(at(raw, col.nik));
    const tingkat = parseTingkat(at(raw, col.rombel));
    const paket = paketFromTingkat(tingkat) || "Paket C";
    const nisn = digits(at(raw, col.nisn));

    const alamat = [
      at(raw, col.alamat),
      at(raw, col.rt) && `RT ${at(raw, col.rt)}`,
      at(raw, col.rw) && `RW ${at(raw, col.rw)}`,
      at(raw, col.dusun) && `Dusun ${at(raw, col.dusun)}`,
      at(raw, col.kelurahan),
      at(raw, col.kecamatan),
      at(raw, col.kodePos) && `Kode Pos ${at(raw, col.kodePos)}`,
    ]
      .filter(Boolean)
      .join(", ")
      .slice(0, 300);

    const emailRaw = at(raw, col.email).toLowerCase();
    const emailKontak = emailRaw.includes("@") ? emailRaw : "";
    const tglLahirRaw = at(raw, col.tglLahir);
    const tanggalLahir = toISODate(raw[col.tglLahir]);

    const flags = [];
    if (!isValidNIK(nik)) flags.push("nik-kosong");
    if (!tingkat) flags.push("tingkat-kosong");
    if (tglLahirRaw && !tanggalLahir) flags.push("tgl-invalid");
    const key = nik || `${paket}|${nama.toLowerCase()}`;
    if (seen.has(key)) flags.push("duplikat");
    seen.add(key);

    rows.push({
      no: at(raw, col.nipd) || r,
      nama,
      nik,
      nis: digits(at(raw, col.nipd)),
      nisn,
      jenisKelamin: jkFull(at(raw, col.jk)),
      agama: at(raw, col.agama),
      tempatLahir: at(raw, col.tempatLahir),
      tanggalLahir,
      tanggalLahirRaw: tglLahirRaw,
      alamat,
      noHp: digits(at(raw, col.hp)) || digits(at(raw, col.telepon)),
      emailKontak,
      sekolahAsal: at(raw, col.sekolahAsal),
      namaAyah: tidyNama(at(raw, col.ayahNama)),
      namaIbu: tidyNama(at(raw, col.ibuNama)),
      tingkat,
      paket,
      tahunAngkatan: IMPORT_TAHUN_ANGKATAN,
      flags,
    });
  }
  return rows;
};

// --- 4. TETAPKAN NOMOR INDUK (berurutan per paket+tahun, lanjut dari yang sudah ada) ---
export const assignNomorInduk = (rows, existingWBList) => {
  const seqByKey = {};
  return rows.map((row) => {
    const tahun = row.tahunAngkatan || IMPORT_TAHUN_ANGKATAN;
    const key = `${row.paket}|${tahun}`;
    if (seqByKey[key] == null) {
      const start = suggestNomorInduk({
        paket: row.paket,
        tahunAngkatan: tahun,
        existing: existingWBList,
      });
      seqByKey[key] = Number(start.slice(5));
    }
    const prefix = nomorIndukPrefix({ paket: row.paket, tahunAngkatan: tahun });
    const nomorInduk = `${prefix}${String(seqByKey[key]).padStart(4, "0")}`;
    seqByKey[key] += 1;
    return { ...row, nomorInduk, tahunAngkatan: tahun };
  });
};

// Flag "lunak" (peringatan) — baris tetap dicentang default. Flag lain (nik-kosong,
// paket-invalid, duplikat, contoh) menonaktifkan centang default.
const SOFT_FLAGS = new Set([
  "tingkat-kosong",
  "tgl-invalid",
  "kemungkinan-berhenti",
  "belum-daftar",
]);
export const defaultSelected = (row) =>
  row.flags.every((f) => SOFT_FLAGS.has(f));

// --- 5. JALANKAN IMPOR (berurutan, aman diulang) ---
export const runImport = async (selectedRows, actor, { onProgress } = {}) => {
  const results = [];
  for (let i = 0; i < selectedRows.length; i += 1) {
    const row = selectedRows[i];
    onProgress?.(i, selectedRows.length, row);
    // Buang field internal; sisanya (nik + data diri) diteruskan apa adanya ke createWB.
    const { no, flags, nomorInduk, tanggalLahirRaw, ...profile } = row;
    void no;
    void flags;
    void tanggalLahirRaw;
    let attempt = 0;
    for (;;) {
      try {
        const res = await createWB(
          {
            ...profile,
            nomorInduk,
            tahunAngkatan: row.tahunAngkatan || IMPORT_TAHUN_ANGKATAN,
          },
          actor,
        );
        results.push({
          nama: row.nama,
          paket: row.paket,
          nomorInduk: res.nomorInduk,
          password: res.password,
          status: "ok",
        });
        break;
      } catch (err) {
        const code = err?.code || err?.cause?.code;
        const msg = err?.message || "";
        if (/NIK sudah terdaftar/i.test(msg)) {
          results.push({
            nama: row.nama,
            paket: row.paket,
            nomorInduk: row.nomorInduk,
            password: "",
            status: "skip",
            note: "NIK sudah terdaftar",
          });
          break;
        }
        if (
          code === "auth/email-already-in-use" ||
          /sudah dipakai/i.test(msg)
        ) {
          results.push({
            nama: row.nama,
            paket: row.paket,
            nomorInduk: row.nomorInduk,
            password: "",
            status: "skip",
            note: "Nomor Induk sudah ada",
          });
          break;
        }
        if (code === "auth/too-many-requests" && attempt === 0) {
          attempt += 1;
          await sleep(30000);
          continue;
        }
        results.push({
          nama: row.nama,
          paket: row.paket,
          nomorInduk: row.nomorInduk,
          password: "",
          status: "error",
          note: err?.message || "Gagal",
        });
        break;
      }
    }
    await sleep(500); // beri jeda supaya tidak kena throttle Firebase Auth
  }
  onProgress?.(selectedRows.length, selectedRows.length, null);
  return results;
};

// --- 6. HAPUS SEMUA WB LAMA ---
export const deleteAllWB = async (wbList, actor, { onProgress } = {}) => {
  for (let i = 0; i < wbList.length; i += 1) {
    onProgress?.(i, wbList.length, wbList[i]);
    await deleteWB(wbList[i], actor);
    await sleep(120);
  }
  onProgress?.(wbList.length, wbList.length, null);
};

// --- 7. EKSPOR KREDENSIAL (CSV) ---
const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export const buildCredentialsCsv = async (wbList) => {
  const withNI = wbList.filter((w) => w.nomorInduk);
  const lines = ["Nama,Paket,Nomor Induk,Password"];
  for (const w of withNI) {
    let pwd = "";
    try {
      const snap = await getDoc(doc(db, "wbSecrets", w.id));
      if (snap.exists()) pwd = snap.data().pwd || "";
    } catch {
      /* password tidak tersimpan / tidak terbaca — biarkan kosong */
    }
    lines.push(
      [w.nama, w.paket || "", w.nomorInduk, pwd].map(csvCell).join(","),
    );
  }
  return lines.join("\r\n");
};

export const downloadCsv = (csv, filename) => {
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
