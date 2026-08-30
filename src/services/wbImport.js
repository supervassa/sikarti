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
const serialToISO = (n) => {
  const d = new Date(Math.round((n - 25569) * 86400 * 1000));
  return isNaN(d) ? "" : d.toISOString().slice(0, 10);
};
const toISODate = (v) => {
  if (v == null || v === "") return "";
  if (v instanceof Date && !isNaN(v)) return v.toISOString().slice(0, 10);
  if (typeof v === "number" && isFinite(v)) return serialToISO(v);
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{4,5}$/.test(s)) return serialToISO(Number(s)); // serial Excel sbg teks
  const parts = s.match(/^(\d{1,2})[/. -](\d{1,2})[/. -](\d{4})$/);
  if (parts) {
    const a = +parts[1];
    const b = +parts[2];
    const y = parts[3];
    // Tentukan hari vs bulan; ambigu -> asumsi D/M (lokal Indonesia).
    let d = a;
    let m = b;
    if (a > 12 && b <= 12) {
      d = a;
      m = b;
    } else if (b > 12 && a <= 12) {
      d = b;
      m = a;
    }
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
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
export const downloadTemplate = async () => {
  const XLSX = await import("xlsx");
  const aoa = [
    ["Nama", "NIK", "Paket", "Tahun Angkatan"],
    ["Contoh - Siti Aminah", "3509010101010001", "Paket C", IMPORT_TAHUN_ANGKATAN],
    ["Contoh - Budi Santoso", "3509010101010002", "Paket B", IMPORT_TAHUN_ANGKATAN],
    ["Contoh - Ahmad Fauzi", "3509010101010003", "Paket A", IMPORT_TAHUN_ANGKATAN],
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [{ wch: 32 }, { wch: 20 }, { wch: 14 }, { wch: 16 }];
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

  return looksTemplate
    ? { format: "template", rows: parseTemplateGrid(grid, headerRowIdx) }
    : { format: "mentah", rows: parseMentahGrid(grid) };
};

const parseTemplateGrid = (grid, headerRowIdx) => {
  const header = grid[headerRowIdx].map((c) =>
    String(c ?? "").trim().toLowerCase(),
  );
  const iNama = header.findIndex((h) => h.includes("nama"));
  const iNik = header.findIndex((h) => h === "nik" || h.includes("nik"));
  const iPaket = header.findIndex((h) => h.includes("paket"));
  const iTahun = header.findIndex(
    (h) => h.includes("tahun") || h.includes("angkatan"),
  );

  const rows = [];
  const seen = new Set();
  for (let r = headerRowIdx + 1; r < grid.length; r += 1) {
    const raw = grid[r] || [];
    const nama = cleanNama(raw[iNama]);
    if (!nama) continue;
    const paket = normalizePaket(raw[iPaket]);
    const nik = iNik >= 0 ? digits(raw[iNik]) : "";
    const tahunAngkatan =
      iTahun >= 0 && raw[iTahun]
        ? String(raw[iTahun]).trim()
        : IMPORT_TAHUN_ANGKATAN;

    const flags = [];
    if (CONTOH_RE.test(nama)) flags.push("contoh");
    if (!paket) flags.push("paket-invalid");
    if (!isValidNIK(nik)) flags.push("nik-kosong");
    const key = nik || `${paket}|${nama.toLowerCase()}`;
    if (seen.has(key)) flags.push("duplikat");
    seen.add(key);

    rows.push({
      no: r,
      nama,
      nik,
      paket: paket || "Paket C",
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

    const flags = [];
    if (!isValidNIK(nik)) flags.push("nik-kosong");
    if (!tingkat) flags.push("tingkat-kosong");
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
      tanggalLahir: toISODate(raw[col.tglLahir]),
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
    const { no, flags, nomorInduk, ...profile } = row;
    void no;
    void flags;
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
