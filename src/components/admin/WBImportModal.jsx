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

const FLAG_META = {
  "kemungkinan-berhenti": {
    label: "kemungkinan berhenti",
    cls: "bg-amber-50 text-amber-700",
  },
  "belum-daftar": { label: "belum daftar", cls: "bg-slate-100 text-slate-600" },
  "paket-invalid": { label: "paket tidak valid", cls: "bg-rose-50 text-rose-700" },
  contoh: { label: "baris contoh", cls: "bg-slate-100 text-slate-500" },
  duplikat: { label: "duplikat", cls: "bg-rose-50 text-rose-700" },
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

  const rowLocked = (row) => row.flags.includes("paket-invalid");
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
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            Impor Warga Belajar dari Excel
          </h2>
          {step !== "running" && (
            <button
              onClick={close}
              className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
            >
              Tutup
            </button>
          )}
        </div>

        {/* STEP: UPLOAD */}
        {step === "upload" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <p className="text-sm font-semibold text-slate-700">
                Belum punya file? Unduh template.
              </p>
              <p className="text-xs text-slate-500">
                Template berisi 3 kolom: <b>Nama</b>, <b>Paket</b> (Paket A/B/C),
                <b> Tahun Angkatan</b>. Isi satu baris per WB, lalu unggah kembali
                di sini. Baris contoh otomatis dilewati.
              </p>
              <button
                type="button"
                onClick={() => downloadTemplate().catch(() => {})}
                className="px-3 py-2 text-sm font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-white"
              >
                Unduh Template Kosong (.xlsx)
              </button>
            </div>

            <p className="text-sm text-slate-500">
              Unggah file <b>.xlsx</b> — bisa template di atas, atau file data
              dinas (sheet <b>{SHEET_DEFAULT}</b>). Sistem mendeteksi formatnya
              sendiri. Tiap WB dapat Nomor Induk + password otomatis; yang
              disimpan hanya nama, paket, Nomor Induk, dan tahun angkatan.
            </p>
            <input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={handleFile}
              disabled={busy}
              className="block w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-red-600 file:text-white file:font-semibold hover:file:bg-red-700"
            />
            {busy && <p className="text-sm text-slate-500">Membaca file…</p>}
            {parseError && (
              <p className="text-sm text-rose-600">{parseError}</p>
            )}
          </div>
        )}

        {/* STEP: PREVIEW */}
        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              {sheetNames.length > 1 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Sheet
                  </label>
                  <select
                    value={sheetName}
                    onChange={(e) => changeSheet(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500"
                  >
                    {sheetNames.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                Format:{" "}
                {format === "template"
                  ? "Template rapi"
                  : "Data dinas (PAKET ABC)"}
              </span>
            </div>

            {listWB.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
                <p className="text-sm text-amber-800">
                  Masih ada <b>{listWB.length}</b> WB lama di sistem. Biasanya
                  dihapus dulu sebelum impor bersih.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    value={confirmHapus}
                    onChange={(e) => setConfirmHapus(e.target.value)}
                    placeholder='ketik HAPUS'
                    className="px-2 py-1.5 border rounded-lg text-sm w-32 outline-none focus:border-rose-500"
                  />
                  <button
                    type="button"
                    disabled={busy || confirmHapus !== "HAPUS"}
                    onClick={handleDeleteOld}
                    className="px-3 py-1.5 text-sm font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 disabled:opacity-50"
                  >
                    Hapus semua WB lama
                  </button>
                  {busy && progress.label === "Menghapus WB lama" && (
                    <span className="text-xs text-slate-500">
                      {progress.current}/{progress.total}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="font-semibold text-slate-700">
                {selectedRows.length} akan diimpor
              </span>
              <span className="text-slate-400">
                dari {rows.length} baris terbaca
              </span>
              {Object.entries(perPaket).map(([p, n]) => (
                <span
                  key={p}
                  className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold"
                >
                  {p}: {n}
                </span>
              ))}
              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  onClick={() => setAll(true)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Pilih semua
                </button>
                <button
                  type="button"
                  onClick={() => setAll(false)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Kosongkan
                </button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="max-h-[46vh] overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold sticky top-0">
                    <tr>
                      <th className="px-3 py-2 w-10"></th>
                      <th className="px-3 py-2">Nama</th>
                      <th className="px-3 py-2">Paket</th>
                      <th className="px-3 py-2">Nomor Induk</th>
                      <th className="px-3 py-2">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
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
                        <td className="px-3 py-2 font-medium text-slate-800">
                          {r.nama}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-600">
                          {r.paket}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-slate-700">
                          {r.nomorInduk}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            {r.flags.map((f) => (
                              <span
                                key={f}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${FLAG_META[f]?.cls || "bg-slate-100 text-slate-600"}`}
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
                className="px-4 py-2 text-sm text-slate-600 font-semibold"
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
            <p className="text-sm text-slate-600">
              Membuat akun {progress.current}/{progress.total}…
            </p>
            <p className="text-xs text-slate-400 truncate">{progress.label}</p>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
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
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold">
                Berhasil: {summary.ok || 0}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-bold">
                Dilewati: {summary.skip || 0}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-bold">
                Gagal: {summary.error || 0}
              </span>
            </div>

            <div id="wb-import-print" className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="max-h-[46vh] overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold sticky top-0">
                    <tr>
                      <th className="px-3 py-2">Nama</th>
                      <th className="px-3 py-2">Paket</th>
                      <th className="px-3 py-2">Nomor Induk</th>
                      <th className="px-3 py-2">Password</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {results.map((r, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 font-medium text-slate-800">
                          {r.nama}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-600">
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
                className="px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Download CSV
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
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
