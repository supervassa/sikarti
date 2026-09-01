import React, { useMemo, useRef, useState } from "react";
import {
  SHEET_DEFAULT,
  assignNomorInduk,
  defaultSelected,
  deleteAllWB,
  downloadCsv,
  downloadTemplate,
  parseSheet,
  parseWorkbook,
  runImport,
} from "../../services/wbImport";
import SelectField from "../common/SelectField";

const FLAG_META = {
  "kemungkinan-berhenti": {
    label: "kemungkinan berhenti",
    cls: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  },
  "belum-daftar": {
    label: "belum daftar",
    cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  },
  "paket-invalid": {
    label: "paket tidak valid",
    cls: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  },
  "nik-kosong": {
    label: "NIK kosong / tidak valid",
    cls: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  },
  "tingkat-kosong": {
    label: "tingkat kosong",
    cls: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  },
  "tgl-invalid": {
    label: "tgl lahir tak terbaca",
    cls: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  },
  contoh: {
    label: "baris contoh",
    cls: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  },
  duplikat: {
    label: "duplikat",
    cls: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  },
};

const FORMAT_LABEL = {
  dapodik: "Data Dapodik (lengkap)",
  template: "Template rapi",
  mentah: "Data dinas lama (PAKET ABC)",
};

const csvFromResults = (results) => {
  const cell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = ["Nama,Paket,Nomor Induk,Password,Status"];
  for (const r of results) {
    lines.push(
      [r.nama, r.paket, r.nomorInduk, r.password, r.status].map(cell).join(","),
    );
  }
  return lines.join("\r\n");
};

const WBImportModal = ({ open, onClose, listWB, actor }) => {
  const [step, setStep] = useState("upload"); // upload | preview | running | done
  const [busy, setBusy] = useState(false);
  const [parseError, setParseError] = useState("");

  const wbRef = useRef(null); // { workbook, XLSX }
  const [sheetNames, setSheetNames] = useState([]);
  const [sheetName, setSheetName] = useState(SHEET_DEFAULT);
  const [format, setFormat] = useState("template");
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState([]);

  const [confirmHapus, setConfirmHapus] = useState("");
  const [progress, setProgress] = useState({ current: 0, total: 0, label: "" });
  const [results, setResults] = useState([]);

  const selectedRows = useMemo(
    () => rows.filter((_, i) => selected[i]),
    [rows, selected],
  );

  const perPaket = useMemo(() => {
    const acc = {};
    selectedRows.forEach((r) => {
      acc[r.paket] = (acc[r.paket] || 0) + 1;
    });
    return acc;
  }, [selectedRows]);

  const summary = useMemo(() => {
    const s = { ok: 0, skip: 0, error: 0 };
    results.forEach((r) => {
      s[r.status] = (s[r.status] || 0) + 1;
    });
    return s;
  }, [results]);

  if (!open) return null;

  const reset = () => {
    setStep("upload");
    setBusy(false);
    setParseError("");
    wbRef.current = null;
    setSheetNames([]);
    setSheetName(SHEET_DEFAULT);
    setFormat("template");
    setRows([]);
    setSelected([]);
    setConfirmHapus("");
    setProgress({ current: 0, total: 0, label: "" });
    setResults([]);
  };

  const close = () => {
    if (step === "running") return;
    reset();
    onClose();
  };

  const buildRows = (workbook, XLSX, name) => {
    const { format: fmt, rows: parsed } = parseSheet(workbook, XLSX, name);
    const withNI = assignNomorInduk(parsed, listWB);
    setFormat(fmt);
    setRows(withNI);
    setSelected(withNI.map(defaultSelected));
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setParseError("");
    try {
      const { workbook, sheetNames: names, XLSX } = await parseWorkbook(file);
      wbRef.current = { workbook, XLSX };
      setSheetNames(names);
      const pick = names.includes(SHEET_DEFAULT) ? SHEET_DEFAULT : names[0];
      setSheetName(pick);
      buildRows(workbook, XLSX, pick);
      setStep("preview");
    } catch (err) {
      setParseError("Gagal membaca file: " + (err?.message || err));
    } finally {
      setBusy(false);
    }
  };

  const changeSheet = (name) => {
    setSheetName(name);
    if (wbRef.current) {
      buildRows(wbRef.current.workbook, wbRef.current.XLSX, name);
    }
  };

  const rowLocked = (row) =>
    row.flags.includes("paket-invalid") || row.flags.includes("nik-kosong");
  const toggle = (i) => {
    if (rowLocked(rows[i])) return;
    setSelected((s) => s.map((v, idx) => (idx === i ? !v : v)));
  };
  // "Pilih semua" tidak mencentang baris yang paketnya tidak valid.
  const setAll = (v) => setSelected(rows.map((r) => v && !rowLocked(r)));

  const handleDeleteOld = async () => {
    if (confirmHapus !== "HAPUS") return;
    setBusy(true);
    setProgress({ current: 0, total: listWB.length, label: "Menghapus WB lama" });
    try {
      await deleteAllWB(listWB, actor, {
        onProgress: (c, t) =>
          setProgress({ current: c, total: t, label: "Menghapus WB lama" }),
      });
      setConfirmHapus("");
    } catch (err) {
      alert("Gagal menghapus sebagian WB: " + err.message);
    } finally {
      setBusy(false);
      setProgress({ current: 0, total: 0, label: "" });
    }
  };

  const handleRun = async () => {
    setStep("running");
    setProgress({ current: 0, total: selectedRows.length, label: "" });
    const res = await runImport(selectedRows, actor, {
      onProgress: (c, t, row) =>
        setProgress({ current: c, total: t, label: row?.nama || "" }),
    });
    setResults(res);
    setStep("done");
  };

  const pct =
    progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-[70] bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Impor Warga Belajar dari Excel
          </h2>
          {step !== "running" && (
            <button
              onClick={close}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold"
            >
              Tutup
            </button>
          )}
        </div>

        {/* STEP: UPLOAD */}
        {step === "upload" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 space-y-2">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Cara termudah: ekspor <b>Dapodik</b>.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Unggah langsung file <b>&ldquo;Daftar Peserta Didik&rdquo;</b> dari
                Dapodik (.xlsx). Semua data ikut terisi: NIK, NISN, tempat/tanggal
                lahir, alamat, agama, nama orang tua, tingkat, sekolah asal.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Atau unduh template — kolomnya persis field Data Diri WB (Nama,
                NIK, NISN, JK, Agama, TTL, Alamat, No HP, Email, Sekolah Asal,
                Ayah, Ibu, Tingkat, Paket, Tahun Angkatan) sehingga Anda bisa
                menyalin kolom dari Dapodik ke sini. <b>NIK</b> wajib 16 digit.
              </p>
              <button
                type="button"
                onClick={() => downloadTemplate().catch(() => {})}
                className="px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-white dark:hover:bg-slate-800"
              >
                Unduh Template Kosong (.xlsx)
              </button>
            </div>

            <details className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-4">
              <summary className="text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                Ketentuan kolom — kolom mana yang wajib?
              </summary>
              <div className="mt-3 space-y-3 text-xs text-slate-600 dark:text-slate-400">
                <div>
                  <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Wajib (baris tidak dapat diimpor bila kosong):
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <b>Nama</b> — baris tanpa nama otomatis dilewati.
                    </li>
                    <li>
                      <b>NIK</b> — 16 digit angka. Baris tanpa NIK valid terkunci
                      (centang nonaktif). NIK dipakai sebagai kunci anti-duplikat.
                    </li>
                    <li>
                      <b>Paket</b> <i>atau</i> <b>Tingkat</b> — minimal salah satu.
                      Jika Tingkat diisi (mis. 10), Paket otomatis: 10–12 → C,
                      7–9 → B, 1–6 → A. Jika dua-duanya kosong, baris terkunci
                      (&ldquo;paket tidak valid&rdquo;).
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Opsional (boleh kosong satu kolom penuh):
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <b>NISN</b> — kosong otomatis jadi &ldquo;NISN belum
                      ada&rdquo;.
                    </li>
                    <li>
                      <b>Tingkat</b> — kosong hanya jadi peringatan kuning, baris
                      tetap ikut terimpor.
                    </li>
                    <li>
                      <b>Tahun Angkatan</b> — kosong → default {" "}
                      <span className="font-mono">2026/2027</span>.
                    </li>
                    <li>
                      Jenis Kelamin, Agama, Tempat/Tanggal Lahir, Alamat, No HP,
                      Email Kontak, Sekolah Asal, Nama Ayah, Nama Ibu — kosong =
                      field-nya dibiarkan kosong, tanpa error.
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">Catatan format:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      Jenis Kelamin: <span className="font-mono">L</span> /{" "}
                      <span className="font-mono">P</span> atau
                      Laki-laki / Perempuan.
                    </li>
                    <li>
                      Tanggal Lahir: hampir semua format diterima —{" "}
                      <span className="font-mono">2007-05-14</span>,{" "}
                      <span className="font-mono">14/05/2007</span>,{" "}
                      <span className="font-mono">6-7-1983</span>,{" "}
                      <span className="font-mono">14 Mei 2007</span>, serial
                      Excel, dst. Tanggal yang benar-benar tak terbaca ditandai
                      kuning (<i>tgl lahir tak terbaca</i>) &amp; dikosongkan —
                      baris <b>tetap bisa diimpor</b>, tinggal lengkapi lewat
                      Detail WB.
                    </li>
                    <li>
                      Tingkat: angka (10), romawi (X), atau &ldquo;Kelas
                      10&rdquo;.
                    </li>
                    <li>
                      NIK &amp; NISN sebaiknya diformat sebagai <b>Teks</b> di
                      Excel agar angka panjang tidak berubah.
                    </li>
                    <li>Baris &ldquo;Contoh - …&rdquo; otomatis dilewati.</li>
                  </ul>
                </div>
              </div>
            </details>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Sistem mendeteksi format file sendiri. Tiap WB dapat Nomor Induk +
              password otomatis.
            </p>
            <input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleFile}
              disabled={busy}
              className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-red-600 file:text-white file:font-semibold hover:file:bg-red-700"
            />
            {busy && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Membaca file…
              </p>
            )}
            {parseError && (
              <p className="text-sm text-rose-600 dark:text-rose-400">
                {parseError}
              </p>
            )}
          </div>
        )}

        {/* STEP: PREVIEW */}
        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              {sheetNames.length > 1 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Sheet
                  </label>
                  <SelectField
                    className="w-48"
                    value={sheetName}
                    onChange={changeSheet}
                    options={sheetNames}
                  />
                </div>
              )}
              <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold">
                Format: {FORMAT_LABEL[format] || format}
              </span>
            </div>

            {listWB.length > 0 && (
              <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-3 space-y-2">
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  Masih ada <b>{listWB.length}</b> WB lama di sistem. Biasanya
                  dihapus dulu sebelum impor bersih.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    value={confirmHapus}
                    onChange={(e) => setConfirmHapus(e.target.value)}
                    placeholder='ketik HAPUS'
                    className="px-2 py-1.5 border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 rounded-lg text-sm w-32 outline-none focus:border-rose-500"
                  />
                  <button
                    type="button"
                    disabled={busy || confirmHapus !== "HAPUS"}
                    onClick={handleDeleteOld}
                    className="px-3 py-1.5 text-sm font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/20 disabled:opacity-50"
                  >
                    Hapus semua WB lama
                  </button>
                  {busy && progress.label === "Menghapus WB lama" && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {progress.current}/{progress.total}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {selectedRows.length} akan diimpor
              </span>
              <span className="text-slate-400">
                dari {rows.length} baris terbaca
              </span>
              {Object.entries(perPaket).map(([p, n]) => (
                <span
                  key={p}
                  className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs font-bold"
                >
                  {p}: {n}
                </span>
              ))}
              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  onClick={() => setAll(true)}
                  className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                >
                  Pilih semua
                </button>
                <button
                  type="button"
                  onClick={() => setAll(false)}
                  className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                >
                  Kosongkan
                </button>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <div className="max-h-[46vh] overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold sticky top-0">
                    <tr>
                      <th className="px-3 py-2 w-10"></th>
                      <th className="px-3 py-2">Nama</th>
                      <th className="px-3 py-2">NIK</th>
                      <th className="px-3 py-2">Paket</th>
                      <th className="px-3 py-2">Tk.</th>
                      <th className="px-3 py-2">Lahir</th>
                      <th className="px-3 py-2">Nomor Induk</th>
                      <th className="px-3 py-2">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rows.map((r, i) => (
                      <tr
                        key={`${r.nomorInduk}-${i}`}
                        className={selected[i] ? "" : "opacity-50"}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selected[i] || false}
                            disabled={rowLocked(r)}
                            onChange={() => toggle(i)}
                          />
                        </td>
                        <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-100">
                          {r.nama}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-slate-700 dark:text-slate-300">
                          {r.nik || "—"}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400">
                          {r.paket}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400">
                          {r.tingkat || "—"}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {r.tanggalLahir ? (
                            <span className="text-slate-600 dark:text-slate-400">
                              {r.tanggalLahir}
                            </span>
                          ) : r.tanggalLahirRaw ? (
                            <span
                              className="text-amber-600 dark:text-amber-400"
                              title={`Format asli: "${r.tanggalLahirRaw}" — tidak terbaca, akan dikosongkan`}
                            >
                              {r.tanggalLahirRaw} ⚠
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-slate-700 dark:text-slate-300">
                          {r.nomorInduk}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            {r.flags.map((f) => (
                              <span
                                key={f}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${FLAG_META[f]?.cls || "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
                              >
                                {FLAG_META[f]?.label || f}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={close}
                className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={busy || selectedRows.length === 0}
                onClick={handleRun}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-60"
              >
                Impor {selectedRows.length} WB
              </button>
            </div>
          </div>
        )}

        {/* STEP: RUNNING */}
        {step === "running" && (
          <div className="space-y-3 py-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Membuat akun {progress.current}/{progress.total}…
            </p>
            <p className="text-xs text-slate-400 truncate">{progress.label}</p>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-600 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-slate-400">
              Jangan tutup halaman. Proses ini bisa beberapa menit.
            </p>
          </div>
        )}

        {/* STEP: DONE */}
        {step === "done" && (
          <div className="space-y-4">
            <div className="flex gap-3 text-sm">
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold">
                Berhasil: {summary.ok || 0}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                Dilewati: {summary.skip || 0}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 font-bold">
                Gagal: {summary.error || 0}
              </span>
            </div>

            <div
              id="wb-import-print"
              className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden"
            >
              <div className="max-h-[46vh] overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold sticky top-0">
                    <tr>
                      <th className="px-3 py-2">Nama</th>
                      <th className="px-3 py-2">Paket</th>
                      <th className="px-3 py-2">Nomor Induk</th>
                      <th className="px-3 py-2">Password</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {results.map((r, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-100">
                          {r.nama}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400">
                          {r.paket}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs">
                          {r.nomorInduk}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs">
                          {r.password || "—"}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {r.status === "ok"
                            ? "Berhasil"
                            : r.status === "skip"
                              ? "Dilewati (sudah ada)"
                              : `Gagal: ${r.note || ""}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  downloadCsv(
                    csvFromResults(results),
                    `kredensial-wb-impor-${new Date().toISOString().slice(0, 10)}.csv`,
                  )
                }
                className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Download CSV
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cetak Daftar
              </button>
              <button
                type="button"
                onClick={close}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
              >
                Selesai
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WBImportModal;
