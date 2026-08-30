import React, { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faFileLines,
  faPen,
  faTrash,
  faUpRightFromSquare,
} from "@fortawesome/free-solid-svg-icons";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { createTugas, updateTugas, deleteTugas } from "../../services/adminServices";
import SelectField from "../../components/common/SelectField";

const PAKET_TABS = ["Paket A", "Paket B", "Paket C"];
const EMPTY_FORM = { mapelId: "", judul: "", linkFile: "" };

const TugasPage = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("Paket A");
  const [mapelList, setMapelList] = useState([]);
  const [tugasList, setTugasList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    const stopMapel = onSnapshot(
      query(collection(db, "subjects"), orderBy("createdAt", "desc")),
      (snap) => setMapelList(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );
    const stopTugas = onSnapshot(
      query(collection(db, "tugas"), orderBy("createdAt", "desc")),
      (snap) => {
        setTugasList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
    );
    return () => {
      stopMapel();
      stopTugas();
    };
  }, []);

  const mapelForTab = useMemo(
    () => mapelList.filter((m) => m.paket === activeTab),
    [mapelList, activeTab],
  );
  const tugasForTab = useMemo(
    () => tugasList.filter((t) => t.paket === activeTab),
    [tugasList, activeTab],
  );

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, mapelId: mapelForTab[0]?.id || "" });
    setModalOpen(true);
  };
  const openEdit = (t) => {
    setEditingId(t.id);
    setForm({ mapelId: t.mapelId, judul: t.judul, linkFile: t.linkFile });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const mapel = mapelList.find((m) => m.id === form.mapelId);
    if (!mapel) {
      alert("Pilih mata pelajaran dulu.");
      return;
    }
    if (!/^https?:\/\//i.test(form.linkFile.trim())) {
      alert("Link file harus berupa URL (diawali http:// atau https://).");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        mapelId: mapel.id,
        mapelNama: mapel.nama,
        paket: mapel.paket,
        judul: form.judul,
        linkFile: form.linkFile,
      };
      if (editingId) {
        await updateTugas(editingId, payload, currentUser);
      } else {
        await createTugas(payload, currentUser);
      }
      setModalOpen(false);
    } catch (err) {
      alert("Gagal menyimpan tugas: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t) => {
    if (!confirm(`Hapus tugas "${t.judul}"?`)) return;
    try {
      await deleteTugas(t.id, currentUser);
    } catch (err) {
      alert("Gagal menghapus tugas: " + err.message);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Tugas
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Kelola tugas per mata pelajaran. Setiap tugas: judul + link file
            Google Drive.
          </p>
        </div>
        <button
          onClick={openCreate}
          disabled={mapelForTab.length === 0}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
          <span>Tambah Tugas</span>
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

      {mapelForTab.length === 0 && !loading && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          Belum ada mata pelajaran untuk {activeTab}. Buat mapel dulu di menu
          Mata Pelajaran sebelum menambah tugas.
        </p>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <FontAwesomeIcon icon={faFileLines} className="text-red-600 w-4 h-4" />
          <h2 className="font-bold text-slate-900 dark:text-white">
            Tugas — {activeTab}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-3">Judul Tugas</th>
                <th className="px-4 py-3">Mapel</th>
                <th className="px-4 py-3">File</th>
                <th className="px-6 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-slate-400">
                    Memuat data tugas...
                  </td>
                </tr>
              ) : tugasForTab.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-slate-400">
                    Belum ada tugas untuk {activeTab}.
                  </td>
                </tr>
              ) : (
                tugasForTab.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-6 py-3 font-semibold text-slate-800 dark:text-slate-100">
                      {t.judul}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                      {t.mapelNama}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={t.linkFile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:underline"
                      >
                        Buka
                        <FontAwesomeIcon
                          icon={faUpRightFromSquare}
                          className="w-3 h-3"
                        />
                      </a>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(t)}
                          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Edit"
                        >
                          <FontAwesomeIcon icon={faPen} className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(t)}
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
              {editingId ? "Edit" : "Tambah"} Tugas
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Mata Pelajaran ({activeTab})
                </label>
                <SelectField
                  required
                  value={form.mapelId}
                  onChange={(val) => setForm({ ...form, mapelId: val })}
                  placeholder="Pilih mapel…"
                  options={mapelForTab.map((m) => ({
                    value: m.id,
                    label: m.kode ? `${m.kode} — ${m.nama}` : m.nama,
                  }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Judul Tugas
                </label>
                <input
                  required
                  type="text"
                  maxLength={200}
                  value={form.judul}
                  onChange={(e) => setForm({ ...form, judul: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500 bg-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Link File (Google Drive)
                </label>
                <input
                  required
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={form.linkFile}
                  onChange={(e) =>
                    setForm({ ...form, linkFile: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500 bg-transparent"
                />
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Tempel link &ldquo;Bagikan&rdquo; dari Google Drive. Pastikan
                  aksesnya &ldquo;Siapa saja yang memiliki link&rdquo;.
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

export default TugasPage;
