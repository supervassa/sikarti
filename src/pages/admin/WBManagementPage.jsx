import React, { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import {
  createWB,
  updateWB,
  normalizeWBStatus,
  setWBLifecycleStatus,
  deleteWB,
  resetUserPassword,
  getWBPassword,
  resetWBPassword,
} from "../../services/adminServices";
import {
  isValidNomorInduk,
  suggestNomorInduk,
} from "../../utils/wbLogin";
import Pagination from "../../components/common/Pagination";

const PAKET_TABS = ["Semua", "Paket A", "Paket B", "Paket C"];

const CURRENT_YEAR = new Date().getFullYear();
const TAHUN_ANGKATAN_OPTIONS = Array.from({ length: 5 }, (_, i) => {
  const y = CURRENT_YEAR - 3 + i;
  return `${y}/${y + 1}`;
});
const DEFAULT_TAHUN_ANGKATAN = `${CURRENT_YEAR}/${CURRENT_YEAR + 1}`;

const STATUS_META = {
  AKTIF: { label: "Aktif", className: "bg-emerald-50 text-emerald-700" },
  NONAKTIF: { label: "Nonaktif", className: "bg-rose-50 text-rose-700" },
  LULUS: { label: "Lulus", className: "bg-blue-50 text-blue-700" },
};

const EMPTY_FORM = {
  nama: "",
  nomorInduk: "",
  emailKontak: "",
  paket: "Paket C",
  tahunAngkatan: DEFAULT_TAHUN_ANGKATAN,
  nik: "",
  noHp: "",
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

  // Kartu kredensial hasil "Tambah WB" atau "Buat Password Baru".
  const [credential, setCredential] = useState(null);
  const [copied, setCopied] = useState(false);

  const [detailWB, setDetailWB] = useState(null);
  const [editForm, setEditForm] = useState({
    nama: "",
    emailKontak: "",
    email: "",
    paket: "Paket C",
    tahunAngkatan: DEFAULT_TAHUN_ANGKATAN,
    nik: "",
    noHp: "",
  });
  const [statusForm, setStatusForm] = useState({
    status: "AKTIF",
    tahunLulus: DEFAULT_TAHUN_ANGKATAN,
    terakhirAktif: DEFAULT_TAHUN_ANGKATAN,
  });
  const [savingDetail, setSavingDetail] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [viewedPassword, setViewedPassword] = useState(null);
  const [pwdBusy, setPwdBusy] = useState(false);

  const [searchNama, setSearchNama] = useState("");
  const [filterPaket, setFilterPaket] = useState("Semua");
  const [filterTahun, setFilterTahun] = useState("Semua");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const q = query(collection(db, "users"), where("kd_role", "==", 22));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setListWB(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const tahunOptionsFromData = useMemo(() => {
    const fromData = listWB.map((wb) => wb.tahunAngkatan).filter(Boolean);
    return Array.from(new Set([...TAHUN_ANGKATAN_OPTIONS, ...fromData])).sort();
  }, [listWB]);

  const filteredWB = useMemo(() => {
    return listWB.filter((wb) => {
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
  }, [listWB, searchNama, filterPaket, filterTahun]);

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
    setIsModalOpen(true);
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
    setSaving(true);
    try {
      const result = await createWB({ ...form, nomorInduk: ni }, currentUser);
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

  const openDetail = (wb) => {
    setDetailWB(wb);
    setViewedPassword(null);
    setEditForm({
      nama: wb.nama || "",
      emailKontak: wb.emailKontak || "",
      email: wb.email || "",
      paket: wb.paket || "Paket C",
      tahunAngkatan: wb.tahunAngkatan || DEFAULT_TAHUN_ANGKATAN,
      nik: wb.nik || "",
      noHp: wb.noHp || "",
    });
    setStatusForm({
      status: normalizeWBStatus(wb.status),
      tahunLulus: wb.tahunLulus || DEFAULT_TAHUN_ANGKATAN,
      terakhirAktif: wb.terakhirAktif || DEFAULT_TAHUN_ANGKATAN,
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSavingDetail(true);
    try {
      const payload = {
        nama: editForm.nama,
        paket: editForm.paket,
        tahunAngkatan: editForm.tahunAngkatan,
        nik: editForm.nik,
        noHp: editForm.noHp,
      };
      if (detailWB.nomorInduk) {
        // Login pakai Nomor Induk: email (synthetic) & nomorInduk tak diubah lewat form ini,
        // cukup email kontak. Field lain yang tak dikirim tetap seperti sebelumnya (merge).
        payload.emailKontak = editForm.emailKontak.trim().toLowerCase();
      } else {
        // WB lama: email = kredensial login, tetap bisa diedit seperti sebelumnya.
        payload.email = editForm.email;
      }
      await updateWB(detailWB.id, payload, currentUser, detailWB.status);
      setDetailWB(null);
    } catch (err) {
      alert("Gagal memperbarui data WB: " + err.message);
    } finally {
      setSavingDetail(false);
    }
  };

  const handleStatusSave = async () => {
    setSavingStatus(true);
    try {
      await setWBLifecycleStatus(
        { id: detailWB.id, ...statusForm },
        currentUser,
      );
      setDetailWB({ ...detailWB, ...statusForm });
    } catch (err) {
      alert("Gagal mengubah status WB: " + err.message);
    } finally {
      setSavingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Hapus data ${detailWB.nama} dari sistem? Akses WB ini ke aplikasi akan langsung dicabut.`,
      )
    )
      return;
    setSavingDetail(true);
    try {
      await deleteWB(detailWB, currentUser);
      setDetailWB(null);
    } catch (err) {
      alert("Gagal menghapus data WB: " + err.message);
    } finally {
      setSavingDetail(false);
    }
  };

  // WB lama (punya email asli, tanpa Nomor Induk): kirim tautan reset lewat email.
  const handleEmailReset = async () => {
    if (!confirm(`Kirim email reset password ke ${detailWB.email}?`)) return;
    setPwdBusy(true);
    try {
      await resetUserPassword(detailWB, currentUser, "MANAJEMEN_WB");
      alert("Email reset password telah dikirim ke " + detailWB.email);
    } catch (err) {
      alert("Gagal mengirim email reset: " + err.message);
    } finally {
      setPwdBusy(false);
    }
  };

  const handleViewPassword = async () => {
    setPwdBusy(true);
    try {
      const pwd = await getWBPassword(detailWB);
      setViewedPassword(pwd || "(tidak tersimpan)");
    } catch (err) {
      alert("Gagal membaca password: " + err.message);
    } finally {
      setPwdBusy(false);
    }
  };

  const handleGeneratePassword = async () => {
    if (
      !confirm(
        `Buat password baru untuk ${detailWB.nama}? Password lama akan langsung tidak berlaku.`,
      )
    )
      return;
    setPwdBusy(true);
    try {
      const newPwd = await resetWBPassword(detailWB, currentUser);
      setViewedPassword(null);
      setCopied(false);
      setCredential({
        title: "Password baru dibuat",
        nama: detailWB.nama,
        nomorInduk: detailWB.nomorInduk,
        password: newPwd,
      });
    } catch (err) {
      alert("Gagal membuat password baru: " + err.message);
    } finally {
      setPwdBusy(false);
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
          <h1 className="text-2xl font-bold text-slate-900">
            Manajemen Warga Belajar
          </h1>
          <p className="text-sm text-slate-500">
            Kelola data siswa Paket A, Paket B, dan Paket C PKBM KARTINI.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow transition-all flex items-center justify-center space-x-2"
        >
          <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
          <span>Tambah WB Baru</span>
        </button>
      </div>

      {/* Tab Program Paket */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {PAKET_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setFilterPaket(tab);
              setPage(1);
            }}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap transition-all ${
              filterPaket === tab
                ? "border-red-600 text-red-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab === "Semua" ? "Semua Paket" : tab}
            <span className="ml-1.5 text-xs text-slate-400">
              {tab === "Semua"
                ? listWB.length
                : listWB.filter((wb) => (wb.paket || "Paket C") === tab).length}
            </span>
          </button>
        ))}
      </div>

      {/* Filter & Pencarian */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2.5">
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
            className="bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400 w-full"
          />
        </div>
        <select
          value={filterTahun}
          onChange={(e) => {
            setFilterTahun(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-red-500 bg-white"
        >
          <option value="Semua">Semua Angkatan</option>
          {tahunOptionsFromData.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Tabel Data WB */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-semibold">
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
            <tbody className="divide-y divide-slate-100">
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
                  <tr key={wb.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {wb.nama}
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-slate-700">
                      {wb.nomorInduk || (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {wb.paket || "Paket C"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-600">
                      {wb.tahunAngkatan || "-"}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-600">
                      <p>{wb.emailKontak || (wb.nomorInduk ? "—" : wb.email)}</p>
                      <p className="text-slate-400">{wb.noHp || "-"}</p>
                    </td>
                    <td className="px-4 py-4">{renderStatusBadge(wb)}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openDetail(wb)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                      >
                        Detail
                      </button>
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
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-900">
              Tambah Warga Belajar
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nama Lengkap
                </label>
                <input
                  required
                  type="text"
                  value={form.nama}
                  onChange={(e) => updateAddForm({ nama: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Program Paket
                  </label>
                  <select
                    value={form.paket}
                    onChange={(e) => updateAddForm({ paket: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500"
                  >
                    <option value="Paket A">Paket A (Setara SD)</option>
                    <option value="Paket B">Paket B (Setara SMP)</option>
                    <option value="Paket C">Paket C (Setara SMA)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Tahun Angkatan
                  </label>
                  <select
                    value={form.tahunAngkatan}
                    onChange={(e) =>
                      updateAddForm({ tahunAngkatan: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500"
                  >
                    {TAHUN_ANGKATAN_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
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
                  className="w-full px-3 py-2 border rounded-lg text-sm font-mono outline-none focus:border-red-500"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  9 digit angka, disarankan otomatis. Boleh diubah sesuai
                  penomoran lembaga. WB login pakai Nomor Induk ini + password
                  yang dibuat sistem.
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Email Kontak (opsional)
                </label>
                <input
                  type="email"
                  value={form.emailKontak}
                  onChange={(e) =>
                    updateAddForm({ emailKontak: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500"
                  placeholder="Untuk pemberitahuan, bukan untuk login"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    NIK (opsional)
                  </label>
                  <input
                    type="text"
                    value={form.nik}
                    onChange={(e) => updateAddForm({ nik: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Nomor HP (opsional)
                  </label>
                  <input
                    type="tel"
                    value={form.noHp}
                    onChange={(e) => updateAddForm({ noHp: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 font-semibold"
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
            className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl"
          >
            <h2 className="text-lg font-bold text-slate-900">
              {credential.title}
            </h2>
            <div className="rounded-xl border-2 border-dashed border-slate-300 p-4 space-y-2 bg-slate-50">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-400">
                  Nama
                </p>
                <p className="font-semibold text-slate-800">{credential.nama}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-400">
                  Nomor Induk
                </p>
                <p className="font-mono text-lg font-bold text-slate-900">
                  {credential.nomorInduk}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-400">
                  Password
                </p>
                <p className="font-mono text-lg font-bold text-slate-900">
                  {credential.password}
                </p>
              </div>
            </div>
            <p className="text-xs text-amber-600">
              Catat / cetak dan berikan ke Warga Belajar. Password masih bisa
              dilihat lagi lewat menu <b>Detail</b>.
            </p>
            <div className="flex gap-2 kredensial-actions">
              <button
                type="button"
                onClick={copyCredential}
                className="flex-1 px-3 py-2 text-sm font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                {copied ? "Tersalin ✓" : "Salin"}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 px-3 py-2 text-sm font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
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

      {/* Modal Detail / Edit WB */}
      {detailWB && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                Detail Warga Belajar
              </h2>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_META[normalizeWBStatus(detailWB.status)].className}`}
              >
                {STATUS_META[normalizeWBStatus(detailWB.status)].label}
              </span>
            </div>

            <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">
                Nomor Induk (login WB)
              </p>
              {detailWB.nomorInduk ? (
                <p className="font-mono text-base font-bold text-slate-800">
                  {detailWB.nomorInduk}
                </p>
              ) : (
                <>
                  <p className="text-sm font-semibold text-slate-500">
                    Belum ada
                  </p>
                  <p className="mt-1 text-[11px] text-amber-600">
                    WB ini dibuat dengan email, jadi login lewat tab
                    &ldquo;Pengajar &amp; Staf&rdquo; memakai email. Untuk pindah
                    ke login Nomor Induk: hapus lalu tambahkan ulang WB ini.
                  </p>
                </>
              )}
            </div>

            <form onSubmit={handleUpdate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nama Lengkap
                </label>
                <input
                  required
                  type="text"
                  value={editForm.nama}
                  onChange={(e) =>
                    setEditForm({ ...editForm, nama: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500"
                />
              </div>
              {detailWB.nomorInduk ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Email Kontak (opsional)
                  </label>
                  <input
                    type="email"
                    value={editForm.emailKontak}
                    onChange={(e) =>
                      setEditForm({ ...editForm, emailKontak: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500"
                    placeholder="Untuk pemberitahuan, bukan untuk login"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Email
                  </label>
                  <input
                    required
                    type="email"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500"
                  />
                  <p className="mt-1 text-[11px] text-amber-600">
                    Ini hanya mengubah email kontak di sistem. Email login
                    (Firebase Auth) tetap yang lama sampai WB reset password
                    sendiri.
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Program Paket
                  </label>
                  <select
                    value={editForm.paket}
                    onChange={(e) =>
                      setEditForm({ ...editForm, paket: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500"
                  >
                    <option value="Paket A">Paket A (Setara SD)</option>
                    <option value="Paket B">Paket B (Setara SMP)</option>
                    <option value="Paket C">Paket C (Setara SMA)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Tahun Angkatan
                  </label>
                  <select
                    value={editForm.tahunAngkatan}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        tahunAngkatan: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500"
                  >
                    {tahunOptionsFromData.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  NIK
                </label>
                <input
                  type="text"
                  value={editForm.nik}
                  onChange={(e) =>
                    setEditForm({ ...editForm, nik: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nomor HP
                </label>
                <input
                  type="tel"
                  value={editForm.noHp}
                  onChange={(e) =>
                    setEditForm({ ...editForm, noHp: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setDetailWB(null)}
                  className="px-4 py-2 text-sm text-slate-600 font-semibold"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={savingDetail}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-60"
                >
                  {savingDetail ? "Menyimpan…" : "Simpan Data Diri"}
                </button>
              </div>
            </form>

            {/* Kelola Password */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <label className="block text-xs font-semibold text-slate-600">
                Kelola Password
              </label>
              {detailWB.nomorInduk ? (
                <>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={pwdBusy}
                      onClick={handleViewPassword}
                      className="flex-1 px-4 py-2 text-sm font-bold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-60"
                    >
                      Lihat Password
                    </button>
                    <button
                      type="button"
                      disabled={pwdBusy}
                      onClick={handleGeneratePassword}
                      className="flex-1 px-4 py-2 text-sm font-bold text-white bg-slate-800 rounded-lg hover:bg-slate-900 disabled:opacity-60"
                    >
                      Buat Password Baru
                    </button>
                  </div>
                  {viewedPassword && (
                    <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 flex items-center justify-between">
                      <span className="font-mono text-base font-bold text-slate-800">
                        {viewedPassword}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard
                            ?.writeText(viewedPassword)
                            .catch(() => {});
                        }}
                        className="text-xs font-semibold text-red-600 hover:text-red-500"
                      >
                        Salin
                      </button>
                    </div>
                  )}
                  <p className="text-[11px] text-slate-500">
                    "Lihat Password" untuk dibacakan ke WB yang lupa. "Buat
                    Password Baru" bila password harus diganti.
                  </p>
                </>
              ) : (
                <button
                  type="button"
                  disabled={pwdBusy}
                  onClick={handleEmailReset}
                  className="w-full px-4 py-2 text-sm font-bold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-60"
                >
                  Kirim Email Reset Password
                </button>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-3">
              <label className="block text-xs font-semibold text-slate-600">
                Status Keanggotaan
              </label>
              <select
                value={statusForm.status}
                onChange={(e) =>
                  setStatusForm({ ...statusForm, status: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500"
              >
                <option value="AKTIF">Aktif</option>
                <option value="NONAKTIF">Nonaktif</option>
                <option value="LULUS">Lulus</option>
              </select>
              {statusForm.status === "LULUS" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Tahun Lulus
                  </label>
                  <select
                    value={statusForm.tahunLulus}
                    onChange={(e) =>
                      setStatusForm({
                        ...statusForm,
                        tahunLulus: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500"
                  >
                    {tahunOptionsFromData.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {statusForm.status === "NONAKTIF" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Terakhir Aktif
                  </label>
                  <select
                    value={statusForm.terakhirAktif}
                    onChange={(e) =>
                      setStatusForm({
                        ...statusForm,
                        terakhirAktif: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500"
                  >
                    {tahunOptionsFromData.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <button
                type="button"
                disabled={savingStatus}
                onClick={handleStatusSave}
                className="w-full px-4 py-2 text-sm bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-900 disabled:opacity-60"
              >
                {savingStatus ? "Menyimpan…" : "Update Status"}
              </button>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={savingDetail}
                onClick={handleDelete}
                className="w-full px-4 py-2 text-sm font-bold text-rose-700 bg-rose-50 rounded-lg hover:bg-rose-100 disabled:opacity-60"
              >
                Hapus Data WB
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default WBManagementPage;
