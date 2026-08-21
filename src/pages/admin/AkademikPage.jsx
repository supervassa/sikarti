import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faBookOpen, faCalendarDays } from '@fortawesome/free-solid-svg-icons';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { createMapel, createJadwal } from '../../services/adminServices';

const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const AkademikPage = () => {
    const { currentUser } = useAuth();
    const [mapelList, setMapelList] = useState([]);
    const [jadwalList, setJadwalList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null); // 'mapel' | 'jadwal' | null

    const [mapelForm, setMapelForm] = useState({ nama: '', paket: 'Paket C' });
    const [jadwalForm, setJadwalForm] = useState({ namaMapel: '', hari: 'Senin', jamMulai: '', jamSelesai: '', pengajar: '' });

    useEffect(() => {
        const stopMapel = onSnapshot(query(collection(db, 'subjects'), orderBy('createdAt', 'desc')), (snap) => {
            setMapelList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });
        const stopJadwal = onSnapshot(query(collection(db, 'schedules'), orderBy('createdAt', 'desc')), (snap) => {
            setJadwalList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        });
        return () => { stopMapel(); stopJadwal(); };
    }, []);

    const handleMapelSubmit = async (e) => {
        e.preventDefault();
        try {
            await createMapel(mapelForm, currentUser);
            setMapelForm({ nama: '', paket: 'Paket C' });
            setModal(null);
        } catch (err) {
            alert('Gagal menambah mata pelajaran: ' + err.message);
        }
    };

    const handleJadwalSubmit = async (e) => {
        e.preventDefault();
        try {
            await createJadwal(jadwalForm, currentUser);
            setJadwalForm({ namaMapel: '', hari: 'Senin', jamMulai: '', jamSelesai: '', pengajar: '' });
            setModal(null);
        } catch (err) {
            alert('Gagal menambah jadwal: ' + err.message);
        }
    };

    return (
        <section className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mapel & Jadwal</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Kelola mata pelajaran dan jadwal kegiatan belajar.</p>
            </div>

            {/* Mata Pelajaran */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faBookOpen} className="text-red-600 w-4 h-4" />
                        <h2 className="font-bold text-slate-900 dark:text-white">Mata Pelajaran</h2>
                    </div>
                    <button
                        onClick={() => setModal('mapel')}
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold px-3.5 py-2 rounded-xl text-xs shadow transition-all flex items-center gap-2"
                    >
                        <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                        <span>Tambah Mapel</span>
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-3">Nama Mapel</th>
                            <th className="px-4 py-3">Program Paket</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {loading ? (
                            <tr><td colSpan="2" className="text-center py-8 text-slate-400">Memuat data mapel...</td></tr>
                        ) : mapelList.length === 0 ? (
                            <tr><td colSpan="2" className="text-center py-8 text-slate-400">Belum ada mata pelajaran.</td></tr>
                        ) : (
                            mapelList.map((m) => (
                                <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-6 py-3 font-semibold text-slate-800 dark:text-slate-100">{m.nama}</td>
                                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{m.paket}</td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Jadwal */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faCalendarDays} className="text-red-600 w-4 h-4" />
                        <h2 className="font-bold text-slate-900 dark:text-white">Jadwal Kegiatan Belajar</h2>
                    </div>
                    <button
                        onClick={() => setModal('jadwal')}
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold px-3.5 py-2 rounded-xl text-xs shadow transition-all flex items-center gap-2"
                    >
                        <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                        <span>Tambah Jadwal</span>
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-3">Hari</th>
                            <th className="px-4 py-3">Jam</th>
                            <th className="px-4 py-3">Mapel</th>
                            <th className="px-4 py-3">Pengajar</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {jadwalList.length === 0 ? (
                            <tr><td colSpan="4" className="text-center py-8 text-slate-400">Belum ada jadwal.</td></tr>
                        ) : (
                            jadwalList.map((j) => (
                                <tr key={j.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-6 py-3 font-semibold text-slate-800 dark:text-slate-100">{j.hari}</td>
                                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{j.jamMulai} - {j.jamSelesai}</td>
                                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">{j.namaMapel}</td>
                                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">{j.pengajar || '-'}</td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {modal === 'mapel' && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tambah Mata Pelajaran</h2>
                        <form onSubmit={handleMapelSubmit} className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Nama Mapel</label>
                                <input
                                    required
                                    type="text"
                                    value={mapelForm.nama}
                                    onChange={(e) => setMapelForm({ ...mapelForm, nama: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500 bg-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Program Paket</label>
                                <select
                                    value={mapelForm.paket}
                                    onChange={(e) => setMapelForm({ ...mapelForm, paket: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500 bg-transparent"
                                >
                                    <option value="Paket A">Paket A (Setara SD)</option>
                                    <option value="Paket B">Paket B (Setara SMP)</option>
                                    <option value="Paket C">Paket C (Setara SMA)</option>
                                </select>
                            </div>
                            <div className="flex justify-end space-x-2 pt-3">
                                <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 font-semibold">Batal</button>
                                <button type="submit" className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {modal === 'jadwal' && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tambah Jadwal</h2>
                        <form onSubmit={handleJadwalSubmit} className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Mata Pelajaran</label>
                                <select
                                    required
                                    value={jadwalForm.namaMapel}
                                    onChange={(e) => setJadwalForm({ ...jadwalForm, namaMapel: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500 bg-transparent"
                                >
                                    <option value="">Pilih mapel...</option>
                                    {mapelList.map((m) => (
                                        <option key={m.id} value={m.nama}>{m.nama}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Hari</label>
                                <select
                                    value={jadwalForm.hari}
                                    onChange={(e) => setJadwalForm({ ...jadwalForm, hari: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500 bg-transparent"
                                >
                                    {HARI.map((h) => <option key={h} value={h}>{h}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Jam Mulai</label>
                                    <input
                                        required
                                        type="time"
                                        value={jadwalForm.jamMulai}
                                        onChange={(e) => setJadwalForm({ ...jadwalForm, jamMulai: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500 bg-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Jam Selesai</label>
                                    <input
                                        required
                                        type="time"
                                        value={jadwalForm.jamSelesai}
                                        onChange={(e) => setJadwalForm({ ...jadwalForm, jamSelesai: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500 bg-transparent"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Pengajar</label>
                                <input
                                    type="text"
                                    value={jadwalForm.pengajar}
                                    onChange={(e) => setJadwalForm({ ...jadwalForm, pengajar: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500 bg-transparent"
                                />
                            </div>
                            <div className="flex justify-end space-x-2 pt-3">
                                <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 font-semibold">Batal</button>
                                <button type="submit" className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
};

export default AkademikPage;
