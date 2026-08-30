// Impor Warga Belajar dari file Excel. Dua format didukung otomatis:
//  - "template"  : file rapi hasil "Unduh Template" (kolom: Nama, Paket, Tahun Angkatan)
//  - "mentah"    : sheet "PAKET ABC" dari data dinas (judul section di kolom A, dll.)
// Memakai alur createWB yang sudah ada: tiap WB dapat Nomor Induk + password ter-generate,
// dokumen users/{uid} + wbSecrets/{uid}. "Inti saja": hanya nama, paket, Nomor Induk,
// tahun angkatan, status — NISN/alamat/ortu/dll tidak disimpan.
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase.js";
import { createWB, deleteWB } from "./adminServices.js";
import { nomorIndukPrefix, suggestNomorInduk } from "../utils/wbLogin.js";

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
    ["Nama", "Paket", "Tahun Angkatan"],
    ["Contoh - Siti Aminah", "Paket C", IMPORT_TAHUN_ANGKATAN],
    ["Contoh - Budi Santoso", "Paket B", IMPORT_TAHUN_ANGKATAN],
    ["Contoh - Ahmad Fauzi", "Paket A", IMPORT_TAHUN_ANGKATAN],
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [{ wch: 32 }, { wch: 14 }, { wch: 16 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, TEMPLATE_SHEET);
  XLSX.writeFile(wb, "template-impor-wb.xlsx");
};

// --- 3. PARSE SATU SHEET (auto: template atau mentah) ---
// Balik: { format: "template" | "mentah", rows: [{ no, nama, paket, tahunAngkatan, flags }] }
export const parseSheet = (workbook, XLSX, sheetName) => {
  const ws = workbook.Sheets[sheetName];
  if (!ws) return { format: "mentah", rows: [] };
  const grid = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    raw: true,
    blankrows: false,
  });

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
    const tahunAngkatan =
      iTahun >= 0 && raw[iTahun]
        ? String(raw[iTahun]).trim()
        : IMPORT_TAHUN_ANGKATAN;

    const flags = [];
    if (CONTOH_RE.test(nama)) flags.push("contoh");
    if (!paket) flags.push("paket-invalid");
    const key = `${paket}|${nama.toLowerCase()}`;
    if (seen.has(key)) flags.push("duplikat");
    seen.add(key);

    rows.push({
      no: r,
      nama,
      paket: paket || "Paket C",
      tahunAngkatan,
      flags,
    });
  }
  return rows;
};

// Sheet "PAKET ABC": judul section di kolom A menentukan paket; baris WB = kolom A angka & kolom B nama.
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

    const flags = [];
    if (BERHENTI_RE.test(namaAsli)) flags.push("kemungkinan-berhenti");
    if (BELUM_RE.test(namaAsli)) flags.push("belum-daftar");
    const key = `${currentPaket}|${nama.toLowerCase()}`;
    if (seen.has(key)) flags.push("duplikat");
    seen.add(key);

    rows.push({
      no: a,
      nama,
      paket: currentPaket,
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

export const defaultSelected = (row) => row.flags.length === 0;

// --- 5. JALANKAN IMPOR (berurutan, aman diulang) ---
export const runImport = async (selectedRows, actor, { onProgress } = {}) => {
  const results = [];
  for (let i = 0; i < selectedRows.length; i += 1) {
    const row = selectedRows[i];
    onProgress?.(i, selectedRows.length, row);
    let attempt = 0;
    for (;;) {
      try {
        const res = await createWB(
          {
            nama: row.nama,
            nomorInduk: row.nomorInduk,
            paket: row.paket,
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
        if (
          code === "auth/email-already-in-use" ||
          /sudah dipakai/i.test(err?.message || "")
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
