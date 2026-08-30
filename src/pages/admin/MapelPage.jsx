import React, { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faBookOpen, faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { createMapel, updateMapel, deleteMapel } from "../../services/adminServices";
import SelectField from "../../components/common/SelectField";
import { PAKET_OPTIONS } from "../../config/opsi";

const PAKET_TABS = ["Paket A", "Paket B", "Paket C"];
const emptyForm = (paket) => ({ nama: "", paket });

const MapelPage = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("Paket A");
  const [mapelList, setMapelList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm("Paket A"));

  useEffect(() => {
    const stop = onSnapshot(
      query(collection(db, "subjects"), orderBy("createdAt", "desc")),
      (snap) => {
        setMapelList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
    );
    return stop;
  }, []);

  const mapelForTab = useMemo(
    () => mapelList.filter((m) => m.paket === activeTab),
    [mapelList, activeTab],
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm(activeTab));
    setModalOpen(true);
  };
  const openEdit = (m) => {
    setEditingId(m.id);
    setForm({ nama: m.nama, paket: m.paket });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateMapel(editingId, form, currentUser);
      } else {
        await createMapel(form, currentUser);
      }
      setModalOpen(false);
    } catch (err) {
      alert("Gagal menyimpan mata pelajaran: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (m) => {
    if (!confirm(`Hapus mata pelajaran "${m.nama}"?`)) return;
    try {
      await deleteMapel(m.id, currentUser);
    } catch (err) {
      alert("Gagal menghapus mata pelajaran: " + err.message);
    }
  };

  // Mapel lama belum punya kode — sekali klik untuk membuatkannya (updateMapel auto-generate).
  const handleBuatKode = async (m) => {
    try {
      await updateMapel(m.id, { nama: m.nama, paket: m.paket }, currentUser);
    } catch (err) {
      alert("Gagal membuat kode mapel: " + err.message);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Mata Pelajaran
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Kelola daftar mata pelajaran per program paket.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow transition-all flex items-center justify-center gap-2"
        >
          <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
          <span>Tambah Mapel</span>
        </button>
      </div>

      {/* Tabs Paket */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
        {PAKET_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-all ${
              activeTab === tab
                ? "border-red-600 text-red-600 dark:text-red-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <FontAwesomeIcon icon={faBookOpen} className="text-red-600 w-4 h-4" />
          <h2 className="font-bold text-slate-900 dark:text-white">
            Mata Pelajaran — {activeTab}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-3">Kode</th>
                <th className="px-4 py-3">Nama Mapel</th>
                <th className="px-4 py-3">Program Paket</th>
                <th className="px-6 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-slate-400">
                    Memuat data mapel...
                  </td>
                </tr>
              ) : mapelForTab.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-slate-400">
                    Belum ada mata pelajaran untuk {activeTab}.
                  </td>
                </tr>
              ) : (
                mapelForTab.map((m) => (
                  <tr
                    key={m.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-6 py-3">
                      {m.kode ? (
                        <span className="font-mono font-bold text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          {m.kode}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleBuatKode(m)}
                          className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline"
                        >
                          Buat kode
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">
                      {m.nama}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                      {m.paket}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(m)}
                          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Edit"
                        >
                          <FontAwesomeIcon icon={faPen} className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(m)}
                          className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                          title="Hapus"
                        >
                          <FontAwesomeIcon
                            icon={faTrash}
                            className="w-3.5 h-3.5"
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {editingId ? "Edit" : "Tambah"} Mata Pelajaran
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Nama Mapel
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
                  Program Paket
                </label>
                <SelectField
                  value={form.paket}
                  onChange={(val) => setForm({ ...form, paket: val })}
                  options={PAKET_OPTIONS}
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Kode mapel dibuat otomatis sesuai paket (mis. C01, C02).
                </p>
              </div>
              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
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
    </section>
  );
};

export default MapelPage;
