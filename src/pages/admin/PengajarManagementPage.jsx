import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import {
  createPengajar,
  updatePengajar,
  setPengajarStatus,
  deletePengajar,
  resetUserPassword,
} from "../../services/adminServices";

const PengajarManagementPage = () => {
  const { currentUser } = useAuth();
  const [listPengajar, setListPengajar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    nama: "",
    email: "",
  });

  const [detailPengajar, setDetailPengajar] = useState(null);
  const [editForm, setEditForm] = useState({
    nama: "",
    email: "",
    mapelDiampu: "",
    noHp: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "users"), where("kd_role", "==", 33));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setListPengajar(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      );
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createPengajar(form, currentUser);
      setForm({ nama: "", email: "" });
      setIsModalOpen(false);
      alert("Pengajar berhasil ditambahkan! Email set password telah dikirim.");
    } catch (err) {
      alert(
        err.code === "auth/email-already-in-use"
          ? "Email tersebut sudah digunakan."
          : "Gagal menambah data pengajar: " + err.message,
      );
    }
  };

  const openDetail = (pengajar) => {
    setDetailPengajar(pengajar);
    setEditForm({
      nama: pengajar.nama || "",
      email: pengajar.email || "",
      mapelDiampu: pengajar.mapelDiampu || "",
      noHp: pengajar.noHp || "",
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updatePengajar(detailPengajar.id, editForm, currentUser);
      setDetailPengajar(null);
    } catch (err) {
      alert("Gagal memperbarui data pengajar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    setSaving(true);
    try {
      const nextStatus = await setPengajarStatus(detailPengajar, currentUser);
      setDetailPengajar({ ...detailPengajar, status: nextStatus });
    } catch (err) {
      alert("Gagal mengubah status pengajar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Hapus data ${detailPengajar.nama} dari sistem? Akses pengajar ini ke aplikasi akan langsung dicabut.`,
      )
    )
      return;
    setSaving(true);
    try {
      await deletePengajar(detailPengajar, currentUser);
      setDetailPengajar(null);
    } catch (err) {
      alert("Gagal menghapus data pengajar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!confirm(`Kirim email reset password ke ${detailPengajar.email}?`))
      return;
    setSaving(true);
    try {
      await resetUserPassword(
        detailPengajar,
        currentUser,
        "MANAJEMEN_PENGAJAR",
      );
      alert("Email reset password telah dikirim ke " + detailPengajar.email);
    } catch (err) {
      alert("Gagal mengirim email reset: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Data Pengajar
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Kelola data tutor dan tenaga pengajar PKBM KARTINI.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow transition-all flex items-center justify-center space-x-2"
        >
          <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
          <span>Tambah Pengajar</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Nama Lengkap</th>
                <th className="px-4 py-4">Mapel Diampu</th>
                <th className="px-4 py-4">Kontak / Email</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-6 py-4">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-slate-400">
                    Memuat data pengajar...
                  </td>
                </tr>
              ) : listPengajar.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-slate-400">
                    Belum ada data pengajar.
                  </td>
                </tr>
              ) : (
                listPengajar.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-100">
                      {p.nama}
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {p.mapelDiampu || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-600 dark:text-slate-300">
                      <p>{p.email}</p>
                      <p className="text-slate-400">{p.noHp || "-"}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          p.status !== false
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {p.status !== false ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openDetail(p)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Tambah Pengajar
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Nama Lengkap
                </label>
                <input
                  required
                  type="text"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500 bg-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Email Aktif
                </label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500 bg-transparent"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Mapel diampu &amp; nomor HP bisa dilengkapi lewat Detail
                  setelah akun dibuat.
                </p>
              </div>
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
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailPengajar && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Detail Pengajar
              </h2>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  detailPengajar.status !== false
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700"
                }`}
              >
                {detailPengajar.status !== false ? "Aktif" : "Nonaktif"}
              </span>
            </div>
            <form onSubmit={handleUpdate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Nama Lengkap
                </label>
                <input
                  required
                  type="text"
                  value={editForm.nama}
                  onChange={(e) =>
                    setEditForm({ ...editForm, nama: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500 bg-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Email
                </label>
                <input
                  required
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500 bg-transparent"
                />
                <p className="mt-1 text-[11px] text-amber-600">
                  Ini hanya mengubah email kontak di sistem. Email login
                  (Firebase Auth) tetap yang lama sampai pengajar reset password
                  sendiri.
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Mata Pelajaran Diampu
                </label>
                <input
                  required
                  type="text"
                  value={editForm.mapelDiampu}
                  onChange={(e) =>
                    setEditForm({ ...editForm, mapelDiampu: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500 bg-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Nomor HP
                </label>
                <input
                  type="tel"
                  value={editForm.noHp}
                  onChange={(e) =>
                    setEditForm({ ...editForm, noHp: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500 bg-transparent"
                />
              </div>
              <div className="flex items-center justify-between pt-3">
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleToggleStatus}
                  className={`px-3 py-2 text-xs font-bold rounded-lg disabled:opacity-60 ${
                    detailPengajar.status !== false
                      ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  }`}
                >
                  {detailPengajar.status !== false ? "Nonaktifkan" : "Aktifkan"}
                </button>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setDetailPengajar(null)}
                    className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 font-semibold"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-60"
                  >
                    {saving ? "Menyimpan…" : "Simpan"}
                  </button>
                </div>
              </div>
            </form>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <button
                type="button"
                disabled={saving}
                onClick={handleResetPassword}
                className="w-full px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"
              >
                Kirim Email Reset Password
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleDelete}
                className="w-full px-4 py-2 text-sm font-bold text-rose-700 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/20 disabled:opacity-60"
              >
                Hapus Data Pengajar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default PengajarManagementPage;
