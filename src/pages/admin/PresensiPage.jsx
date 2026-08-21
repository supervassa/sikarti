import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { recordPresensi } from '../../services/adminServices';

const STATUS_STYLE = {
    Hadir: 'bg-emerald-50 text-emerald-700',
    Izin: 'bg-blue-50 text-blue-700',
    Sakit: 'bg-amber-50 text-amber-700',
    Alpa: 'bg-rose-50 text-rose-700',
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const PresensiPage = () => {
    const { currentUser } = useAuth();
    const [wbList, setWbList] = useState([]);
    const [presensi, setPresensi] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form, setForm] = useState({ wbId: '', nama: '', status: 'Hadir', tanggal: todayISO() });

    useEffect(() => {
        const stopWB = onSnapshot(query(collection(db, 'users'), where('kd_role', '==', 22)), (snap) => {
            setWbList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        });
        const stopPresensi = onSnapshot(query(collection(db, 'presensi'), orderBy('createdAt', 'desc')), (snap) => {
            setPresensi(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });
        return () => { stopWB(); stopPresensi(); };
    }, []);

    const handleWBChange = (wbId) => {
        const wb = wbList.find((item) => item.id === wbId);
        setForm({ ...form, wbId, nama: wb?.nama || '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await recordPresensi(form, currentUser);
            setForm({ wbId: '', nama: '', status: 'Hadir', tanggal: todayISO() });
            setIsModalOpen(false);
        } catch (err) {
            alert('Gagal mencatat presensi: ' + err.message);
        }
    };

    return (
        <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Rekap Kehadiran</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Catatan kehadiran Warga Belajar per hari.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow transition-all flex items-center justify-center space-x-2"
                >
                    <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
                    <span>Catat Kehadiran</span>
                </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">Tanggal</th>
                            <th className="px-4 py-4">Nama WB</th>
                            <th className="px-4 py-4">Status</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {loading ? (
                            <tr><td colSpan="3" className="text-center py-8 text-slate-400">Memuat data kehadiran...</td></tr>
                        ) : presensi.length === 0 ? (
                            <tr><td colSpan="3" className="text-center py-8 text-slate-400">Belum ada catatan kehadiran.</td></tr>
                        ) : (
                            presensi.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">{p.tanggal}</td>
                                    <td className="px-4 py-4 font-semibold text-slate-800 dark:text-slate-100">{p.nama}</td>
                                    <td className="px-4 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLE[p.status] || 'bg-slate-100 text-slate-600'}`}>
                                            {p.status}
                                        </span>
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
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Catat Kehadiran</h2>
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Warga Belajar</label>
                                <select
                                    required
                                    value={form.wbId}
                                    onChange={(e) => handleWBChange(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500 bg-transparent"
                                >
                                    <option value="">Pilih WB...</option>
                                    {wbList.map((wb) => (
                                        <option key={wb.id} value={wb.id}>{wb.nama}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Tanggal</label>
                                <input
                                    required
                                    type="date"
                                    value={form.tanggal}
                                    onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500 bg-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Status</label>
                                <select
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500 bg-transparent"
                                >
                                    {Object.keys(STATUS_STYLE).map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="flex justify-end space-x-2 pt-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 font-semibold">Batal</button>
                                <button type="submit" className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
};

export default PresensiPage;
