import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faBookOpen, faCalendarDays, faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
import TimePicker from 'react-time-picker';
import 'react-time-picker/dist/TimePicker.css';
import 'react-clock/dist/Clock.css';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import {
    createMapel, updateMapel, deleteMapel,
    createJadwal, updateJadwal, deleteJadwal,
} from '../../services/adminServices';

const PAKET_TABS = ['Paket A', 'Paket B', 'Paket C'];
const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const emptyMapelForm = (paket) => ({ nama: '', paket });
const emptyJadwalForm = (paket) => ({ namaMapel: '', hari: 'Senin', jamMulai: '', jamSelesai: '', pengajar: '', paket });

const AkademikPage = () => {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('Paket A');
    const [mapelList, setMapelList] = useState([]);
    const [jadwalList, setJadwalList] = useState([]);
    const [pengajarList, setPengajarList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null); // 'mapel' | 'jadwal' | null
    const [saving, setSaving] = useState(false);

    const [editingMapelId, setEditingMapelId] = useState(null);
    const [mapelForm, setMapelForm] = useState(emptyMapelForm(activeTab));

    const [editingJadwalId, setEditingJadwalId] = useState(null);
    const [jadwalForm, setJadwalForm] = useState(emptyJadwalForm(activeTab));
    const [pengajarQuery, setPengajarQuery] = useState('');
    const [showPengajarSuggestions, setShowPengajarSuggestions] = useState(false);

    useEffect(() => {
        const stopMapel = onSnapshot(query(collection(db, 'subjects'), orderBy('createdAt', 'desc')), (snap) => {
            setMapelList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });
        const stopJadwal = onSnapshot(query(collection(db, 'schedules'), orderBy('createdAt', 'desc')), (snap) => {
            setJadwalList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        });
        const stopPengajar = onSnapshot(query(collection(db, 'users'), where('kd_role', '==', 33)), (snap) => {
            setPengajarList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        });
        return () => { stopMapel(); stopJadwal(); stopPengajar(); };
    }, []);

    const mapelForTab = useMemo(() => mapelList.filter((m) => m.paket === activeTab), [mapelList, activeTab]);
    const jadwalForTab = useMemo(() => jadwalList.filter((j) => j.paket === activeTab), [jadwalList, activeTab]);
    const filteredPengajar = useMemo(() => {
        if (!pengajarQuery) return pengajarList;
        return pengajarList.filter((p) => p.nama?.toLowerCase().includes(pengajarQuery.toLowerCase()));
    }, [pengajarList, pengajarQuery]);

    const openMapelCreate = () => {
        setEditingMapelId(null);
        setMapelForm(emptyMapelForm(activeTab));
        setModal('mapel');
    };
    const openMapelEdit = (m) => {
        setEditingMapelId(m.id);
        setMapelForm({ nama: m.nama, paket: m.paket });
        setModal('mapel');
    };
    const handleMapelSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingMapelId) {
                await updateMapel(editingMapelId, mapelForm, currentUser);
            } else {
                await createMapel(mapelForm, currentUser);
            }
            setModal(null);
        } catch (err) {
            alert('Gagal menyimpan mata pelajaran: ' + err.message);
        } finally {
            setSaving(false);
        }
    };
    const handleMapelDelete = async (m) => {
        if (!confirm(`Hapus mata pelajaran "${m.nama}"?`)) return;
        try {
            await deleteMapel(m.id, currentUser);
        } catch (err) {
            alert('Gagal menghapus mata pelajaran: ' + err.message);
        }
    };

    const openJadwalCreate = () => {
        setEditingJadwalId(null);
        setJadwalForm(emptyJadwalForm(activeTab));
        setPengajarQuery('');
        setModal('jadwal');
    };
    const openJadwalEdit = (j) => {
        setEditingJadwalId(j.id);
        setJadwalForm({ namaMapel: j.namaMapel, hari: j.hari, jamMulai: j.jamMulai, jamSelesai: j.jamSelesai, pengajar: j.pengajar, paket: j.paket });
        setPengajarQuery(j.pengajar || '');
        setModal('jadwal');
    };
    const handleJadwalSubmit = async (e) => {
        e.preventDefault();
        if (!jadwalForm.jamMulai || !jadwalForm.jamSelesai) {
            alert('Jam mulai dan jam selesai wajib diisi.');
            return;
        }
        setSaving(true);
        try {
            if (editingJadwalId) {
                await updateJadwal(editingJadwalId, jadwalForm, currentUser);
            } else {
                await createJadwal(jadwalForm, currentUser);
            }
            setModal(null);
        } catch (err) {
            alert('Gagal menyimpan jadwal: ' + err.message);
        } finally {
            setSaving(false);
        }
    };
    const handleJadwalDelete = async (j) => {
        if (!confirm(`Hapus jadwal "${j.namaMapel}" (${j.hari})?`)) return;
        try {
            await deleteJadwal(j.id, currentUser);
        } catch (err) {
            alert('Gagal menghapus jadwal: ' + err.message);
        }
    };

    const selectPengajar = (nama) => {
        setJadwalForm({ ...jadwalForm, pengajar: nama });
        setPengajarQuery(nama);
        setShowPengajarSuggestions(false);
    };

    return (
        <section className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mapel & Jadwal</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Kelola mata pelajaran dan jadwal kegiatan belajar per program paket.</p>
            </div>

            {/* Tabs Paket */}
            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
                {PAKET_TABS.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-all ${
                            activeTab === tab
                                ? 'border-red-600 text-red-600 dark:text-red-400'
                                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Mata Pelajaran */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faBookOpen} className="text-red-600 w-4 h-4" />
                        <h2 className="font-bold text-slate-900 dark:text-white">Mata Pelajaran — {activeTab}</h2>
                    </div>
                    <button
                        onClick={openMapelCreate}
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
                            <th className="px-6 py-3">Aksi</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {loading ? (
                            <tr><td colSpan="3" className="text-center py-8 text-slate-400">Memuat data mapel...</td></tr>
                        ) : mapelForTab.length === 0 ? (
                            <tr><td colSpan="3" className="text-center py-8 text-slate-400">Belum ada mata pelajaran untuk {activeTab}.</td></tr>
                        ) : (
                            mapelForTab.map((m) => (
                                <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-6 py-3 font-semibold text-slate-800 dark:text-slate-100">{m.nama}</td>
                                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{m.paket}</td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => openMapelEdit(m)} className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" title="Edit">
                                                <FontAwesomeIcon icon={faPen} className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => handleMapelDelete(m)} className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10" title="Hapus">
                                                <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
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

            {/* Jadwal */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faCalendarDays} className="text-red-600 w-4 h-4" />
                        <h2 className="font-bold text-slate-900 dark:text-white">Jadwal Kegiatan Belajar — {activeTab}</h2>
                    </div>
                    <button
                        onClick={openJadwalCreate}
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
                            <th className="px-6 py-3">Aksi</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {jadwalForTab.length === 0 ? (
                            <tr><td colSpan="5" className="text-center py-8 text-slate-400">Belum ada jadwal untuk {activeTab}.</td></tr>
                        ) : (
                            jadwalForTab.map((j) => (
                                <tr key={j.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-6 py-3 font-semibold text-slate-800 dark:text-slate-100">{j.hari}</td>
                                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{j.jamMulai} - {j.jamSelesai}</td>
                                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">{j.namaMapel}</td>
                                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">{j.pengajar || '-'}</td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => openJadwalEdit(j)} className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" title="Edit">
                                                <FontAwesomeIcon icon={faPen} className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => handleJadwalDelete(j)} className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10" title="Hapus">
                                                <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
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

            {modal === 'mapel' && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{editingMapelId ? 'Edit' : 'Tambah'} Mata Pelajaran</h2>
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
                                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-60">
                                    {saving ? 'Menyimpan…' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {modal === 'jadwal' && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{editingJadwalId ? 'Edit' : 'Tambah'} Jadwal</h2>
                        <form onSubmit={handleJadwalSubmit} className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Program Paket</label>
                                <select
                                    value={jadwalForm.paket}
                                    onChange={(e) => setJadwalForm({ ...jadwalForm, paket: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500 bg-transparent"
                                >
                                    <option value="Paket A">Paket A (Setara SD)</option>
                                    <option value="Paket B">Paket B (Setara SMP)</option>
                                    <option value="Paket C">Paket C (Setara SMA)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Mata Pelajaran</label>
                                <select
                                    required
                                    value={jadwalForm.namaMapel}
                                    onChange={(e) => setJadwalForm({ ...jadwalForm, namaMapel: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500 bg-transparent"
                                >
                                    <option value="">Pilih mapel...</option>
                                    {mapelList.filter((m) => m.paket === jadwalForm.paket).map((m) => (
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
                                    <TimePicker
                                        className="pkbm-time-picker"
                                        clockClassName="pkbm-time-clock"
                                        format="HH:mm"
                                        disableClock={false}
                                        clearIcon={null}
                                        value={jadwalForm.jamMulai || null}
                                        onChange={(val) => setJadwalForm({ ...jadwalForm, jamMulai: val || '' })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Jam Selesai</label>
                                    <TimePicker
                                        className="pkbm-time-picker"
                                        clockClassName="pkbm-time-clock"
                                        format="HH:mm"
                                        disableClock={false}
                                        clearIcon={null}
                                        value={jadwalForm.jamSelesai || null}
                                        onChange={(val) => setJadwalForm({ ...jadwalForm, jamSelesai: val || '' })}
                                    />
                                </div>
                            </div>
                            <div className="relative">
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Pengajar</label>
                                <input
                                    type="text"
                                    autoComplete="off"
                                    value={pengajarQuery}
                                    onChange={(e) => {
                                        setPengajarQuery(e.target.value);
                                        setJadwalForm({ ...jadwalForm, pengajar: e.target.value });
                                        setShowPengajarSuggestions(true);
                                    }}
                                    onFocus={() => setShowPengajarSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowPengajarSuggestions(false), 150)}
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
                                                {p.mapelDiampu && <span className="text-slate-400 text-xs"> · {p.mapelDiampu}</span>}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end space-x-2 pt-3">
                                <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 font-semibold">Batal</button>
                                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-60">
                                    {saving ? 'Menyimpan…' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
};

export default AkademikPage;
