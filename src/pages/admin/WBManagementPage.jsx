import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { createWB, normalizeWBStatus } from "../../services/adminServices";
import {
  DUMMY_TAHUN_ANGKATAN,
  isDummyNomorInduk,
  isValidNIK,
  isValidNomorInduk,
  suggestNomorInduk,
} from "../../utils/wbLogin";
import Pagination from "../../components/common/Pagination";
import DateField from "../../components/common/DateField";
import SelectField from "../../components/common/SelectField";
import WBImportModal from "../../components/admin/WBImportModal";
import { PAKET_OPTIONS } from "../../config/opsi";
import {
  buildCredentialsCsv,
  deleteAllWB,
  downloadCsv,
} from "../../services/wbImport";

const TODAY_ISO = new Date().toISOString().slice(0, 10);

const PAKET_TABS = ["Semua", "Paket A", "Paket B", "Paket C"];

const CURRENT_YEAR = new Date().getFullYear();
const TAHUN_ANGKATAN_OPTIONS = Array.from({ length: 5 }, (_, i) => {
  const y = CURRENT_YEAR - 3 + i;
  return `${y}/${y + 1}`;
});
const DEFAULT_TAHUN_ANGKATAN = `${CURRENT_YEAR}/${CURRENT_YEAR + 1}`;

const STATUS_META = {
  AKTIF: {
    label: "Aktif",
    className:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  },
  NONAKTIF: {
    label: "Nonaktif",
    className:
      "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  },
  LULUS: {
    label: "Lulus",
    className:
      "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  },
};

const JENIS_KELAMIN_OPTIONS = ["Laki-laki", "Perempuan"];
const AGAMA_OPTIONS = [
  "Islam",
  "Kristen",
  "Katolik",
  "Hindu",
  "Buddha",
  "Konghucu",
  "Lainnya",
];

const EMPTY_FORM = {
  nama: "",
  nomorInduk: "",
  emailKontak: "",
  paket: "Paket C",
  tahunAngkatan: DEFAULT_TAHUN_ANGKATAN,
  nik: "",
  noHp: "",
  nisn: "",
  jenisKelamin: "",
  agama: "",
  tempatLahir: "",
  tanggalLahir: "",
  alamat: "",
  sekolahAsal: "",
  namaAyah: "",
  namaIbu: "",
  tingkat: "",
};

const WBManagementPage = () => {
  const { currentUser } = useAuth();
  const [listWB, setListWB] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  // Selama false, Nomor Induk pada form tambah ikut disarankan ulang saat paket/tahun berubah.
  const [nomorIndukTouched, setNomorIndukTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  // Kartu kredensial hasil "Tambah WB".
  const [credential, setCredential] = useState(null);
  const [copied, setCopied] = useState(false);

  const [searchNama, setSearchNama] = useState("");
  const [filterPaket, setFilterPaket] = useState("Semua");
  const [filterTahun, setFilterTahun] = useState("Semua");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [importOpen, setImportOpen] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const [showDummy, setShowDummy] = useState(false);
  const [isDummyForm, setIsDummyForm] = useState(false);
  const [dummyBusy, setDummyBusy] = useState(false);

  // WB uji (Nomor Induk 9999…) disembunyikan dari tabel, hitungan tab, & ekspor —
  // kecuali toggle "Tampilkan WB uji" dinyalakan.
  const dummyList = useMemo(
    () => listWB.filter((wb) => isDummyNomorInduk(wb.nomorInduk)),
    [listWB],
  );
  const visibleWB = useMemo(
    () => (showDummy ? listWB : listWB.filter((wb) => !isDummyNomorInduk(wb.nomorInduk))),
    [listWB, showDummy],
  );

  const handleExportCsv = async () => {
    setExportBusy(true);
    try {
      const csv = await buildCredentialsCsv(visibleWB);
      downloadCsv(
        csv,
        `kredensial-wb-${new Date().toISOString().slice(0, 10)}.csv`,
      );
    } catch (err) {
      alert("Gagal menyusun CSV: " + err.message);
    } finally {
      setExportBusy(false);
    }
  };

  const handleDeleteDummy = async () => {
    if (
      !confirm(
        `Hapus ${dummyList.length} WB uji (Nomor Induk 9999…)? Dokumen users + wbSecrets dihapus; akun Firebase Auth-nya perlu dibersihkan lewat skrip cleanup (--test-only).`,
      )
    )
      return;
    setDummyBusy(true);
    try {
      await deleteAllWB(dummyList, currentUser);
      alert(`${dummyList.length} WB uji dihapus.`);
    } catch (err) {
      alert("Gagal menghapus sebagian WB uji: " + err.message);
    } finally {
      setDummyBusy(false);
    }
  };

  useEffect(() => {
    const q = query(collection(db, "users"), where("kd_role", "==", 22));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setListWB(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const tahunOptionsFromData = useMemo(() => {
    const fromData = visibleWB.map((wb) => wb.tahunAngkatan).filter(Boolean);
    return Array.from(new Set(fromData)).sort();
  }, [visibleWB]);

  const filteredWB = useMemo(() => {
    return visibleWB.filter((wb) => {
      if (
        searchNama &&
        !wb.nama?.toLowerCase().includes(searchNama.toLowerCase()) &&
        !String(wb.nomorInduk || "").includes(searchNama.trim())
      )
        return false;
      if (filterPaket !== "Semua" && (wb.paket || "Paket C") !== filterPaket)
        return false;
      if (filterTahun !== "Semua" && wb.tahunAngkatan !== filterTahun)
        return false;
      return true;
    });
  }, [visibleWB, searchNama, filterPaket, filterTahun]);

  const totalPages = Math.max(1, Math.ceil(filteredWB.length / pageSize));
  const pagedWB = useMemo(() => {
    const start = (Math.min(page, totalPages) - 1) * pageSize;
    return filteredWB.slice(start, start + pageSize);
  }, [filteredWB, page, pageSize, totalPages]);

  const openAddModal = () => {
    setForm({
      ...EMPTY_FORM,
      nomorInduk: suggestNomorInduk({
        paket: EMPTY_FORM.paket,
        tahunAngkatan: EMPTY_FORM.tahunAngkatan,
        existing: listWB,
      }),
    });
    setNomorIndukTouched(false);
    setIsDummyForm(false);
    setIsModalOpen(true);
  };

  // Checkbox "WB uji": kunci tahun angkatan ke 9999/9999 -> Nomor Induk berawalan 9999.
  const toggleDummyForm = (checked) => {
    setIsDummyForm(checked);
    const tahunAngkatan = checked
      ? DUMMY_TAHUN_ANGKATAN
      : DEFAULT_TAHUN_ANGKATAN;
    setForm((prev) => ({
      ...prev,
      tahunAngkatan,
      nomorInduk: nomorIndukTouched
        ? prev.nomorInduk
        : suggestNomorInduk({ paket: prev.paket, tahunAngkatan, existing: listWB }),
    }));
  };

  // Sarankan ulang Nomor Induk saat paket / tahun angkatan berubah (kecuali admin sudah mengetiknya).
  const updateAddForm = (patch) => {
    setForm((prev) => {
      const next = { ...prev, ...patch };
      if (
        !nomorIndukTouched &&
        (patch.paket !== undefined || patch.tahunAngkatan !== undefined)
      ) {
        next.nomorInduk = suggestNomorInduk({
          paket: next.paket,
          tahunAngkatan: next.tahunAngkatan,
          existing: listWB,
        });
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ni = form.nomorInduk.trim();
    if (!isValidNomorInduk(ni)) {
      alert("Nomor Induk harus 9 digit angka. Contoh: 202630042.");
      return;
    }
    if (listWB.some((wb) => String(wb.nomorInduk || "") === ni)) {
      alert("Nomor Induk itu sudah dipakai Warga Belajar lain.");
      return;
    }
    const nik = form.nik.trim();
    if (!isValidNIK(nik)) {
      alert("NIK wajib diisi dan harus 16 digit angka.");
      return;
    }
    if (listWB.some((wb) => String(wb.nik || "").trim() === nik)) {
      alert("NIK itu sudah dipakai Warga Belajar lain.");
      return;
    }
    setSaving(true);
    try {
      const result = await createWB(
        { ...form, nomorInduk: ni, nik },
        currentUser,
      );
      setIsModalOpen(false);
      setForm(EMPTY_FORM);
      setCopied(false);
      setCredential({
        title: "Warga Belajar berhasil ditambahkan",
        nama: form.nama,
        nomorInduk: result.nomorInduk,
        password: result.password,
      });
    } catch (err) {
      alert(
        err.code === "auth/email-already-in-use"
          ? "Nomor Induk itu sudah dipakai Warga Belajar lain."
          : "Gagal menambah data WB: " + err.message,
      );
    } finally {
      setSaving(false);
    }
  };

  const copyCredential = async () => {
    if (!credential) return;
    const text = `PKBM KARTINI\nNama: ${credential.nama}\nNomor Induk: ${credential.nomorInduk}\nPassword: ${credential.password}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Salin manual:\n\n" + text);
    }
  };

  const renderStatusBadge = (wb) => {
    const status = normalizeWBStatus(wb.status);
    const meta = STATUS_META[status];
    return (
      <div>
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-bold ${meta.className}`}
        >
          {meta.label}
        </span>
        {status === "LULUS" && (
          <p className="text-[10px] text-slate-400 mt-1">
            Lulus {wb.tahunLulus}
          </p>
        )}
        {status === "NONAKTIF" && (
          <p className="text-[10px] text-slate-400 mt-1">
            Terakhir aktif {wb.terakhirAktif}
          </p>
        )}
      </div>
    );
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Manajemen Warga Belajar
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Kelola data siswa Paket A, Paket B, dan Paket C PKBM KARTINI.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportCsv}
            disabled={exportBusy || listWB.length === 0}
            className="border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all disabled:opacity-50"
          >
            {exportBusy ? "Menyiapkan…" : "Ekspor Kredensial (CSV)"}
          </button>
          <button
            onClick={() => setImportOpen(true)}
            className="border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all"
          >
            Impor dari Excel
          </button>
          <button
            onClick={openAddModal}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow transition-all flex items-center justify-center space-x-2"
          >
            <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
            <span>Tambah WB Baru</span>
          </button>
        </div>
      </div>

      <WBImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        listWB={listWB}
        actor={currentUser}
      />

      {/* Baris WB uji */}
      {(dummyList.length > 0 || showDummy) && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-4 py-2.5 text-sm">
          <label className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300">
            <input
              type="checkbox"
              checked={showDummy}
              onChange={(e) => {
                setShowDummy(e.target.checked);
                setPage(1);
              }}
            />
            Tampilkan WB uji
          </label>
          <span className="text-amber-700 dark:text-amber-400">
            {dummyList.length} WB uji (Nomor Induk 9999…)
          </span>
          {dummyList.length > 0 && (
            <button
              type="button"
              disabled={dummyBusy}
              onClick={handleDeleteDummy}
              className="ml-auto px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-500/20 disabled:opacity-50"
            >
              {dummyBusy ? "Menghapus…" : "Hapus WB Uji"}
            </button>
          )}
        </div>
      )}

      {/* Tab Program Paket */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        {PAKET_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setFilterPaket(tab);
              setPage(1);
            }}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap transition-all ${
              filterPaket === tab
                ? "border-red-600 text-red-600 dark:text-red-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100"
            }`}
          >
            {tab === "Semua" ? "Semua Paket" : tab}
            <span className="ml-1.5 text-xs text-slate-400">
              {tab === "Semua"
                ? visibleWB.length
                : visibleWB.filter((wb) => (wb.paket || "Paket C") === tab)
                    .length}
            </span>
          </button>
        ))}
      </div>

      {/* Filter & Pencarian */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2.5">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="text-slate-400 w-3.5 h-3.5"
          />
          <input
            type="text"
            placeholder="Cari nama atau Nomor Induk..."
            value={searchNama}
            onChange={(e) => {
              setSearchNama(e.target.value);
              setPage(1);
            }}
            className="bg-transparent outline-none text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 w-full"
          />
        </div>
        <SelectField
          className="w-48"
          value={filterTahun}
          onChange={(val) => {
            setFilterTahun(val);
            setPage(1);
          }}
          options={[
            { value: "Semua", label: "Semua Angkatan" },
            ...tahunOptionsFromData.map((t) => ({ value: t, label: t })),
          ]}
        />
      </div>

      {/* Tabel Data WB */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Nama Lengkap</th>
                <th className="px-4 py-4">Nomor Induk</th>
                <th className="px-4 py-4">Program Paket</th>
                <th className="px-4 py-4">Angkatan</th>
                <th className="px-4 py-4">Kontak</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-6 py-4">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-400">
                    Memuat data Warga Belajar...
                  </td>
                </tr>
              ) : listWB.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-400">
                    Belum ada data Warga Belajar.
                  </td>
                </tr>
              ) : filteredWB.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-400">
                    Tidak ada WB yang cocok dengan filter/pencarian.
                  </td>
                </tr>
              ) : (
                pagedWB.map((wb) => (
                  <tr
                    key={wb.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-100">
                      {wb.nama}
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                      {wb.nomorInduk ? (
                        <span className="inline-flex items-center gap-1.5">
                          {wb.nomorInduk}
                          {isDummyNomorInduk(wb.nomorInduk) && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 text-[10px] font-bold font-sans">
                              UJI
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30">
                        {wb.paket || "Paket C"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-600 dark:text-slate-400">
                      {wb.tahunAngkatan || "-"}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-600 dark:text-slate-400">
                      <p>{wb.emailKontak || (wb.nomorInduk ? "—" : wb.email)}</p>
                      <p className="text-slate-400 dark:text-slate-500">
                        {wb.noHp || "-"}
                      </p>
                    </td>
                    <td className="px-4 py-4">{renderStatusBadge(wb)}</td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/admin/wb/${wb.id}`}
                        className="inline-block px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && filteredWB.length > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={filteredWB.length}
            onPageChange={setPage}
            onPageSizeChange={(n) => {
              setPageSize(n);
              setPage(1);
            }}
            labelItem="WB"
          />
        )}
      </div>

      {/* Modal Form Tambah WB */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Tambah Warga Belajar
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm font-semibold text-amber-800 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-300">
                <input
                  type="checkbox"
                  checked={isDummyForm}
                  onChange={(e) => toggleDummyForm(e.target.checked)}
                />
                WB uji (data dummy) — Nomor Induk 9999…, tidak ikut hitungan &
                ekspor
              </label>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Nama Lengkap
                </label>
                <input
                  required
                  type="text"
                  value={form.nama}
                  onChange={(e) => updateAddForm({ nama: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 rounded-lg text-sm outline-none focus:border-red-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Program Paket
                  </label>
                  <SelectField
                    value={form.paket}
                    onChange={(val) => updateAddForm({ paket: val })}
                    options={PAKET_OPTIONS}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Tahun Angkatan
                  </label>
                  {isDummyForm ? (
                    <div className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono">
                      {DUMMY_TAHUN_ANGKATAN} (uji)
                    </div>
                  ) : (
                    <SelectField
                      value={form.tahunAngkatan}
                      onChange={(val) => updateAddForm({ tahunAngkatan: val })}
                      options={TAHUN_ANGKATAN_OPTIONS}
                    />
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Nomor Induk (untuk login WB)
                </label>
                <input
                  required
                  type="text"
                  inputMode="numeric"
                  value={form.nomorInduk}
                  onChange={(e) => {
                    setNomorIndukTouched(true);
                    setForm((prev) => ({
                      ...prev,
                      nomorInduk: e.target.value.replace(/\D/g, ""),
                    }));
                  }}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 rounded-lg text-sm font-mono outline-none focus:border-red-500"
                />
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  9 digit angka, disarankan otomatis. Boleh diubah sesuai
                  penomoran lembaga. WB login pakai Nomor Induk ini + password
                  yang dibuat sistem.
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Email Kontak (opsional)
                </label>
                <input
                  type="email"
                  value={form.emailKontak}
                  onChange={(e) =>
                    updateAddForm({ emailKontak: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 rounded-lg text-sm outline-none focus:border-red-500"
                  placeholder="Untuk pemberitahuan, bukan untuk login"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    NIK (wajib, 16 digit)
                  </label>
                  <input
                    required
                    type="text"
                    inputMode="numeric"
                    value={form.nik}
                    onChange={(e) =>
                      updateAddForm({ nik: e.target.value.replace(/\D/g, "") })
                    }
                    maxLength={16}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 rounded-lg text-sm font-mono outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Nomor HP (opsional)
                  </label>
                  <input
                    type="tel"
                    value={form.noHp}
                    onChange={(e) => updateAddForm({ noHp: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 rounded-lg text-sm outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <details className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2">
                <summary className="text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
                  Data diri lengkap (opsional)
                </summary>
                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        NISN
                      </label>
                      <input
                        type="text"
                        value={form.nisn}
                        onChange={(e) => updateAddForm({ nisn: e.target.value })}
                        placeholder="Kosongkan bila belum ada"
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 rounded-lg text-sm outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Jenis Kelamin
                      </label>
                      <SelectField
                        value={form.jenisKelamin}
                        onChange={(val) => updateAddForm({ jenisKelamin: val })}
                        placeholder="—"
                        options={JENIS_KELAMIN_OPTIONS}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Agama
                      </label>
                      <SelectField
                        value={form.agama}
                        onChange={(val) => updateAddForm({ agama: val })}
                        placeholder="—"
                        options={AGAMA_OPTIONS}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Tingkat / Kelas
                      </label>
                      <input
                        type="text"
                        value={form.tingkat}
                        onChange={(e) =>
                          updateAddForm({ tingkat: e.target.value })
                        }
                        placeholder="mis. 10"
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 rounded-lg text-sm outline-none focus:border-red-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Tempat Lahir
                      </label>
                      <input
                        type="text"
                        value={form.tempatLahir}
                        onChange={(e) =>
                          updateAddForm({ tempatLahir: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 rounded-lg text-sm outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Tanggal Lahir
                      </label>
                      <DateField
                        value={form.tanggalLahir}
                        onChange={(iso) => updateAddForm({ tanggalLahir: iso })}
                        max={TODAY_ISO}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Alamat
                    </label>
                    <textarea
                      rows={2}
                      value={form.alamat}
                      onChange={(e) => updateAddForm({ alamat: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 rounded-lg text-sm outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Sekolah Asal
                    </label>
                    <input
                      type="text"
                      value={form.sekolahAsal}
                      onChange={(e) =>
                        updateAddForm({ sekolahAsal: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 rounded-lg text-sm outline-none focus:border-red-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Nama Ayah
                      </label>
                      <input
                        type="text"
                        value={form.namaAyah}
                        onChange={(e) =>
                          updateAddForm({ namaAyah: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 rounded-lg text-sm outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Nama Ibu
                      </label>
                      <input
                        type="text"
                        value={form.namaIbu}
                        onChange={(e) =>
                          updateAddForm({ namaIbu: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 rounded-lg text-sm outline-none focus:border-red-500"
                      />
                    </div>
                  </div>
                </div>
              </details>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-60"
                >
                  {saving ? "Menyimpan…" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Kartu Kredensial */}
      {credential && (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 flex items-center justify-center p-4">
          <div
            id="kartu-kredensial-wb"
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl"
          >
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {credential.title}
            </h2>
            <div className="rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 p-4 space-y-2 bg-slate-50 dark:bg-slate-800/50">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-400">
                  Nama
                </p>
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  {credential.nama}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-400">
                  Nomor Induk
                </p>
                <p className="font-mono text-lg font-bold text-slate-900 dark:text-white">
                  {credential.nomorInduk}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-400">
                  Password
                </p>
                <p className="font-mono text-lg font-bold text-slate-900 dark:text-white">
                  {credential.password}
                </p>
              </div>
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Catat / cetak dan berikan ke Warga Belajar. Password masih bisa
              dilihat lagi lewat menu <b>Detail</b>.
            </p>
            <div className="flex gap-2 kredensial-actions">
              <button
                type="button"
                onClick={copyCredential}
                className="flex-1 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {copied ? "Tersalin ✓" : "Salin"}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cetak
              </button>
              <button
                type="button"
                onClick={() => setCredential(null)}
                className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default WBManagementPage;
