import React, { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faCalendarDays,
  faPen,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import {
  createJadwal,
  updateJadwal,
  deleteJadwal,
} from "../../services/adminServices";
import TimeField from "../../components/common/TimeField";

// Tambah menit ke "HH:mm" (untuk saran jam selesai). Balik ke "HH:mm".
const addMinutes = (hhmm, add) => {
  const [h, m] = hhmm.split(":").map(Number);
  const total = (h * 60 + m + add) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(
    total % 60,
  ).padStart(2, "0")}`;
};

const PAKET_TABS = ["Paket A", "Paket B", "Paket C"];
const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "minggu"];

const emptyForm = (paket) => ({
  namaMapel: "",
  hari: "Senin",
  jamMulai: "",
  jamSelesai: "",
  pengajar: "",
  paket,
});

const JadwalPage = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("Paket A");
  const [jadwalList, setJadwalList] = useState([]);
  const [mapelList, setMapelList] = useState([]);
  const [pengajarList, setPengajarList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm("Paket A"));
  const [pengajarQuery, setPengajarQuery] = useState("");
  const [showPengajarSuggestions, setShowPengajarSuggestions] = useState(false);

  useEffect(() => {
    const stopJadwal = onSnapshot(
      query(collection(db, "schedules"), orderBy("createdAt", "desc")),
      (snap) => {
        setJadwalList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
    );
    const stopMapel = onSnapshot(
      query(collection(db, "subjects"), orderBy("createdAt", "desc")),
      (snap) => setMapelList(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );
    const stopPengajar = onSnapshot(
      query(collection(db, "users"), where("kd_role", "==", 33)),
      (snap) =>
        setPengajarList(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );
    return () => {
      stopJadwal();
      stopMapel();
      stopPengajar();
    };
  }, []);

  const jadwalForTab = useMemo(
    () => jadwalList.filter((j) => j.paket === activeTab),
    [jadwalList, activeTab],
  );
  const filteredPengajar = useMemo(() => {
    if (!pengajarQuery) return pengajarList;
    return pengajarList.filter((p) =>
      p.nama?.toLowerCase().includes(pengajarQuery.toLowerCase()),
    );
  }, [pengajarList, pengajarQuery]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm(activeTab));
    setPengajarQuery("");
    setModalOpen(true);
  };
  const openEdit = (j) => {
    setEditingId(j.id);
    setForm({
      namaMapel: j.namaMapel,
      hari: j.hari,
      jamMulai: j.jamMulai,
      jamSelesai: j.jamSelesai,
      pengajar: j.pengajar,
      paket: j.paket,
    });
    setPengajarQuery(j.pengajar || "");
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.jamMulai || !form.jamSelesai) {
      alert("Jam mulai dan jam selesai wajib diisi.");
      return;
    }
    if (form.jamSelesai <= form.jamMulai) {
      alert("Jam selesai harus lebih lambat dari jam mulai.");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateJadwal(editingId, form, currentUser);
      } else {
        await createJadwal(form, currentUser);
      }
      setModalOpen(false);
    } catch (err) {
      alert("Gagal menyimpan jadwal: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (j) => {
    if (!confirm(`Hapus jadwal "${j.namaMapel}" (${j.hari})?`)) return;
    try {
      await deleteJadwal(j.id, currentUser);
    } catch (err) {
      alert("Gagal menghapus jadwal: " + err.message);
    }
  };

  const selectPengajar = (nama) => {
    setForm({ ...form, pengajar: nama });
    setPengajarQuery(nama);
    setShowPengajarSuggestions(false);
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Jadwal Pelajaran
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Kelola jadwal kegiatan belajar per program paket.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow transition-all flex items-center justify-center gap-2"
        >
          <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
          <span>Tambah Jadwal</span>
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
          <FontAwesomeIcon
            icon={faCalendarDays}
            className="text-red-600 w-4 h-4"
          />
          <h2 className="font-bold text-slate-900 dark:text-white">
            Jadwal Kegiatan Belajar — {activeTab}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-3">Hari</th>
                <th className="px-4 py-3">Jam</th>
                <th className="px-4 py-3">Mapel</th>
                <th className="px-4 py-3">Pengajar</th>
                <th className="px-6 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-slate-400">
                    Memuat data jadwal...
                  </td>
                </tr>
              ) : jadwalForTab.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-slate-400">
                    Belum ada jadwal untuk {activeTab}.
                  </td>
                </tr>
              ) : (
                jadwalForTab.map((j) => (
                  <tr
                    key={j.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-6 py-3 font-semibold text-slate-800 dark:text-slate-100">
                      {j.hari}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                      {j.jamMulai} - {j.jamSelesai}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                      {j.namaMapel}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                      {j.pengajar || "-"}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(j)}
                          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Edit"
                        >
                          <FontAwesomeIcon icon={faPen} className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(j)}
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
              {editingId ? "Edit" : "Tambah"} Jadwal
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Program Paket
                </label>
                <select
                  value={form.paket}
                  onChange={(e) => setForm({ ...form, paket: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500 bg-transparent"
                >
                  <option value="Paket A">Paket A (Setara SD)</option>
                  <option value="Paket B">Paket B (Setara SMP)</option>
                  <option value="Paket C">Paket C (Setara SMA)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Mata Pelajaran
                </label>
                <select
                  required
                  value={form.namaMapel}
                  onChange={(e) =>
                    setForm({ ...form, namaMapel: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500 bg-transparent"
                >
                  <option value="">Pilih mapel...</option>
                  {mapelList
                    .filter((m) => m.paket === form.paket)
                    .map((m) => (
                      <option key={m.id} value={m.nama}>
                        {m.nama}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Hari
                </label>
                <select
                  value={form.hari}
                  onChange={(e) => setForm({ ...form, hari: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500 bg-transparent"
                >
                  {HARI.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Jam Mulai
                  </label>
                  <TimeField
                    value={form.jamMulai}
                    onChange={(val) =>
                      setForm((f) => {
                        const next = { ...f, jamMulai: val };
                        // Saran otomatis: jam selesai = 1 jam setelah jam mulai (kalau masih kosong).
                        if (val && !f.jamSelesai) {
                          next.jamSelesai = addMinutes(val, 60);
                        }
                        return next;
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Jam Selesai
                  </label>
                  <TimeField
                    value={form.jamSelesai}
                    onChange={(val) =>
                      setForm((f) => ({ ...f, jamSelesai: val }))
                    }
                  />
                </div>
              </div>
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Pengajar
                </label>
                <input
                  type="text"
                  autoComplete="off"
                  value={pengajarQuery}
                  onChange={(e) => {
                    setPengajarQuery(e.target.value);
                    setForm({ ...form, pengajar: e.target.value });
                    setShowPengajarSuggestions(true);
                  }}
                  onFocus={() => setShowPengajarSuggestions(true)}
                  onBlur={() =>
                    setTimeout(() => setShowPengajarSuggestions(false), 150)
                  }
                  placeholder="Ketik nama pengajar..."
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500 bg-transparent"
                />
                {showPengajarSuggestions && filteredPengajar.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {filteredPengajar.map((p) => (
                      <button
                        type="button"
                        key={p.id}
                        onMouseDown={() => selectPengajar(p.nama)}
                        className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        {p.nama}
                        {p.mapelDiampu && (
                          <span className="text-slate-400 text-xs">
                            {" "}
                            · {p.mapelDiampu}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
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

export default JadwalPage;
