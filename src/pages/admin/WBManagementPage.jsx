import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { createWB } from '../../services/adminServices';

const WBManagementPage = () => {
    const { currentUser } = useAuth();
    const [listWB, setListWB] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form, setForm] = useState({
        nama: '',
        email: '',
        paket: 'Paket C',
        nik: '',
        noHp: '',
    });

    useEffect(() => {
        const q = query(collection(db, 'users'), where('kd_role', '==', 22));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setListWB(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createWB(form, currentUser);
            setForm({ nama: '', email: '', paket: 'Paket C', nik: '', noHp: '' });
            setIsModalOpen(false);
            alert('Warga Belajar berhasil ditambahkan!');
        } catch (err) {
            alert('Gagal menambah data WB: ' + err.message);
        }
    };

    return (
        <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Manajemen Warga Belajar</h1>
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

            {/* Tabel Data WB */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">Nama Lengkap</th>
                            <th className="px-4 py-4">Program Paket</th>
                            <th className="px-4 py-4">Kontak / Email</th>
                            <th className="px-4 py-4">Status</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr>
                                <td colSpan="4" className="text-center py-8 text-slate-400">
                                    Memuat data Warga Belajar...
                                </td>
                            </tr>
                        ) : listWB.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="text-center py-8 text-slate-400">
                                    Belum ada data Warga Belajar.
                                </td>
                            </tr>
                        ) : (
                            listWB.map((wb) => (
                                <tr key={wb.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-semibold text-slate-800">
                                        {wb.nama}
                                    </td>
                                    <td className="px-4 py-4">
                                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                {wb.paket || 'Paket C'}
                                            </span>
                                    </td>
                                    <td className="px-4 py-4 text-xs text-slate-600">
                                        <p>{wb.email}</p>
                                        <p className="text-slate-400">{wb.noHp || '-'}</p>
                                    </td>
                                    <td className="px-4 py-4">
                                            <span
                                                className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                                    wb.status !== false
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-rose-50 text-rose-700'
                                                }`}
                                            >
                                                {wb.status !== false ? 'Aktif' : 'Nonaktif'}
                                            </span>
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
                        <h2 className="text-lg font-bold text-slate-900">Tambah Warga Belajar</h2>
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
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                    Program Paket
                                </label>
                                <select
                                    value={form.paket}
                                    onChange={(e) => setForm({ ...form, paket: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500"
                                >
                                    <option value="Paket A">Paket A (Setara SD)</option>
                                    <option value="Paket B">Paket B (Setara SMP)</option>
                                    <option value="Paket C">Paket C (Setara SMA)</option>
                                </select>
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
        </section>
    );
};

export default WBManagementPage;
