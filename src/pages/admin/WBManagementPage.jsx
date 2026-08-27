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
} from "../../services/adminServices";

const PAKET_OPTIONS = ["Paket A", "Paket B", "Paket C"];

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

const WBManagementPage = () => {
  const { currentUser } = useAuth();
  const [listWB, setListWB] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    nama: "",
    email: "",
    paket: "Paket C",
    tahunAngkatan: DEFAULT_TAHUN_ANGKATAN,
    nik: "",
    noHp: "",
  });

  const [detailWB, setDetailWB] = useState(null);
  const [editForm, setEditForm] = useState({
    nama: "",
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
  const [saving, setSaving] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  const [searchNama, setSearchNama] = useState("");
  const [filterPaket, setFilterPaket] = useState("Semua");
  const [filterTahun, setFilterTahun] = useState("Semua");

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
        !wb.nama?.toLowerCase().includes(searchNama.toLowerCase())
      )
        return false;
      if (filterPaket !== "Semua" && (wb.paket || "Paket C") !== filterPaket)
        return false;
      if (filterTahun !== "Semua" && wb.tahunAngkatan !== filterTahun)
        return false;
      return true;
    });
  }, [listWB, searchNama, filterPaket, filterTahun]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createWB(form, currentUser);
      setForm({
        nama: "",
        email: "",
        paket: "Paket C",
        tahunAngkatan: DEFAULT_TAHUN_ANGKATAN,
        nik: "",
        noHp: "",
      });
      setIsModalOpen(false);
      alert(
        "Warga Belajar berhasil ditambahkan! Email set password telah dikirim.",
      );
    } catch (err) {
      alert(
        err.code === "auth/email-already-in-use"
          ? "Email tersebut sudah digunakan."
          : "Gagal menambah data WB: " + err.message,
      );
    }
  };

  const openDetail = (wb) => {
    setDetailWB(wb);
    setEditForm({
      nama: wb.nama || "",
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
    setSaving(true);
    try {
      await updateWB(detailWB.id, editForm, currentUser, detailWB.status);
      setDetailWB(null);
    } catch (err) {
      alert("Gagal memperbarui data WB: " + err.message);
    } finally {
      setSaving(false);
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
    setSaving(true);
    try {
      await deleteWB(detailWB, currentUser);
      setDetailWB(null);
    } catch (err) {
      alert("Gagal menghapus data WB: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!confirm(`Kirim email reset password ke ${detailWB.email}?`)) return;
    setSaving(true);
    try {
      await resetUserPassword(detailWB, currentUser, "MANAJEMEN_WB");
      alert("Email reset password telah dikirim ke " + detailWB.email);
    } catch (err) {
      alert("Gagal mengirim email reset: " + err.message);
    } finally {
      setSaving(false);
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
          onClick={() => setIsModalOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow transition-all flex items-center justify-center space-x-2"
        >
          <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
          <span>Tambah WB Baru</span>
        </button>
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
            placeholder="Cari nama Warga Belajar..."
            value={searchNama}
            onChange={(e) => setSearchNama(e.target.value)}
            className="bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400 w-full"
          />
        </div>
        <select
          value={filterPaket}
          onChange={(e) => setFilterPaket(e.target.value)}
          className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-red-500 bg-white"
        >
          <option value="Semua">Semua Paket</option>
          {PAKET_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          value={filterTahun}
          onChange={(e) => setFilterTahun(e.target.value)}
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
                <th className="px-4 py-4">Program Paket</th>
                <th className="px-4 py-4">Angkatan</th>
                <th className="px-4 py-4">Kontak / Email</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-6 py-4">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-400">
                    Memuat data Warga Belajar...
                  </td>
                </tr>
              ) : listWB.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-400">
                    Belum ada data Warga Belajar.
                  </td>
                </tr>
              ) : filteredWB.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-400">
                    Tidak ada WB yang cocok dengan filter/pencarian.
                  </td>
                </tr>
              ) : (
                filteredWB.map((wb) => (
                  <tr key={wb.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {wb.nama}
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
                      <p>{wb.email}</p>
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
      </div>

      {/* Modal Form Tambah WB */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
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
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Email Active
                </label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
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
                    onChange={(e) =>
                      setForm({ ...form, paket: e.target.value })
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
                    value={form.tahunAngkatan}
                    onChange={(e) =>
                      setForm({ ...form, tahunAngkatan: e.target.value })
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
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
                >
                  Simpan
                </button>
              </div>
            </form>
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
                  disabled={saving}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-60"
                >
                  {saving ? "Menyimpan…" : "Simpan Data Diri"}
                </button>
              </div>
            </form>

            {/* Status Keanggotaan */}
            <div className="pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={saving}
                onClick={handleResetPassword}
                className="w-full px-4 py-2 text-sm font-bold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-60"
              >
                Kirim Email Reset Password
              </button>
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
                disabled={saving}
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
