import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import DateField from "../../components/common/DateField";
import SelectField from "../../components/common/SelectField";
import { formatTanggal } from "../../utils/tanggal";
import {
  createTagihan,
  updateTagihanStatus,
} from "../../services/adminServices";

const formatRupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const KeuanganPage = () => {
  const { currentUser } = useAuth();
  const [wbList, setWbList] = useState([]);
  const [tagihan, setTagihan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [form, setForm] = useState({
    wbId: "",
    nama: "",
    keterangan: "SPP Bulanan",
    jumlah: "",
    jatuhTempo: "",
  });

  useEffect(() => {
    const stopWB = onSnapshot(
      query(collection(db, "users"), where("kd_role", "==", 22)),
      (snap) => {
        setWbList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
    );
    const stopTagihan = onSnapshot(
      query(collection(db, "invoices"), orderBy("createdAt", "desc")),
      (snap) => {
        setTagihan(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
    );
    return () => {
      stopWB();
      stopTagihan();
    };
  }, []);

  const handleWBChange = (wbId) => {
    const wb = wbList.find((item) => item.id === wbId);
    setForm({ ...form, wbId, nama: wb?.nama || "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createTagihan(
        { ...form, jumlah: Number(form.jumlah) },
        currentUser,
      );
      setForm({
        wbId: "",
        nama: "",
        keterangan: "SPP Bulanan",
        jumlah: "",
        jatuhTempo: "",
      });
      setIsModalOpen(false);
    } catch (err) {
      alert("Gagal menambah tagihan: " + err.message);
    }
  };

  const toggleLunas = async (item) => {
    setProcessingId(item.id);
    try {
      await updateTagihanStatus(
        item.id,
        item.status === "LUNAS" ? "BELUM_LUNAS" : "LUNAS",
        currentUser,
        item,
      );
    } catch (err) {
      alert("Gagal memperbarui status tagihan: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Informasi Tagihan
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Kelola tagihan SPP dan pembayaran Warga Belajar.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow transition-all flex items-center justify-center space-x-2"
        >
          <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
          <span>Tambah Tagihan</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Nama WB</th>
                <th className="px-4 py-4">Keterangan</th>
                <th className="px-4 py-4">Jumlah</th>
                <th className="px-4 py-4">Jatuh Tempo</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-6 py-4">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-400">
                    Memuat data tagihan...
                  </td>
                </tr>
              ) : tagihan.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-400">
                    Belum ada data tagihan.
                  </td>
                </tr>
              ) : (
                tagihan.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-100">
                      {t.nama}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-600 dark:text-slate-300">
                      {t.keterangan}
                    </td>
                    <td className="px-4 py-4 text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {formatRupiah(t.jumlah)}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500 dark:text-slate-400">
                      {formatTanggal(t.jatuhTempo)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${t.status === "LUNAS" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                      >
                        {t.status === "LUNAS" ? "Lunas" : "Belum Lunas"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        disabled={processingId === t.id}
                        onClick={() => toggleLunas(t)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"
                      >
                        {t.status === "LUNAS"
                          ? "Tandai Belum Lunas"
                          : "Tandai Lunas"}
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
              Tambah Tagihan
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Warga Belajar
                </label>
                <SelectField
                  required
                  value={form.wbId}
                  onChange={handleWBChange}
                  placeholder="Pilih WB..."
                  options={wbList.map((wb) => ({ value: wb.id, label: wb.nama }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Keterangan
                </label>
                <input
                  required
                  type="text"
                  value={form.keterangan}
                  onChange={(e) =>
                    setForm({ ...form, keterangan: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500 bg-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Jumlah (Rp)
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  value={form.jumlah}
                  onChange={(e) => setForm({ ...form, jumlah: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500 bg-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Jatuh Tempo
                </label>
                <DateField
                  required
                  value={form.jatuhTempo}
                  onChange={(iso) => setForm({ ...form, jatuhTempo: iso })}
                  clearable={false}
                />
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
    </section>
  );
};

export default KeuanganPage;
