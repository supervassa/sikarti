import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faImage } from '@fortawesome/free-solid-svg-icons';
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

const formatWaktu = (value) =>
    value?.toDate ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(value.toDate()) : '-';

const PhotoThumb = ({ src, onOpen }) =>
    src ? (
        <button type="button" onClick={() => onOpen(src)} className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
            <img src={src} alt="Foto presensi" className="w-full h-full object-cover" />
        </button>
    ) : (
        <span className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600">
            <FontAwesomeIcon icon={faImage} className="w-4 h-4" />
        </span>
    );

const SessionStatus = ({ session, now }) => {
    if (session.finalizedAt) {
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">Selesai</span>;
    }
    if (session.stoppedAt) {
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">Dihentikan</span>;
    }
    const startedMs = session.startedAt?.toMillis?.() ?? session.startedAt?.seconds * 1000;
    const stillActive = startedMs && now < startedMs + session.durasiMenit * 60000;
    return stillActive
        ? <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">Berlangsung</span>
        : <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">Menunggu finalisasi</span>;
};

const MapsLink = ({ lokasi }) =>
    lokasi ? (
        <a
            href={`https://www.google.com/maps?q=${lokasi.lat},${lokasi.lng}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-600 hover:underline"
        >
            Lihat lokasi
        </a>
    ) : (
        <span className="text-xs text-slate-400">-</span>
    );

const PresensiPage = () => {
    const { currentUser } = useAuth();
    const [tab, setTab] = useState('wb'); // 'wb' | 'pengajar'
    const [wbList, setWbList] = useState([]);
    const [presensi, setPresensi] = useState([]);
    const [sesiKelas, setSesiKelas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form, setForm] = useState({ wbId: '', nama: '', status: 'Hadir', tanggal: todayISO() });
    const [photoModal, setPhotoModal] = useState(null);
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        const stopWB = onSnapshot(query(collection(db, 'users'), where('kd_role', '==', 22)), (snap) => {
            setWbList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        });
        const stopPresensi = onSnapshot(query(collection(db, 'presensi'), orderBy('createdAt', 'desc')), (snap) => {
            setPresensi(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });
        const stopSesi = onSnapshot(query(collection(db, 'classSessions'), orderBy('startedAt', 'desc')), (snap) => {
            setSesiKelas(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        });
        return () => { stopWB(); stopPresensi(); stopSesi(); };
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
                    <p className="text-sm text-slate-500 dark:text-slate-400">Catatan kehadiran Warga Belajar dan Pengajar.</p>
                </div>
                {tab === 'wb' && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow transition-all flex items-center justify-center space-x-2"
                    >
                        <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
                        <span>Catat Kehadiran</span>
                    </button>
                )}
            </div>

            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
                {[{ key: 'wb', label: 'Warga Belajar' }, { key: 'pengajar', label: 'Pengajar' }].map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-all ${
                            tab === t.key
                                ? 'border-red-600 text-red-600 dark:text-red-400'
                                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100'
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === 'wb' ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">Foto</th>
                                <th className="px-4 py-4">Tanggal</th>
                                <th className="px-4 py-4">Nama WB</th>
                                <th className="px-4 py-4">Mapel</th>
                                <th className="px-4 py-4">Status</th>
                                <th className="px-4 py-4">Lokasi</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr><td colSpan="6" className="text-center py-8 text-slate-400">Memuat data kehadiran...</td></tr>
                            ) : presensi.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-8 text-slate-400">Belum ada catatan kehadiran.</td></tr>
                            ) : (
                                presensi.map((p) => (
                                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-6 py-3"><PhotoThumb src={p.fotoBase64} onOpen={setPhotoModal} /></td>
                                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{p.tanggal}</td>
                                        <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">{p.nama}</td>
                                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">{p.namaMapel || '-'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLE[p.status] || 'bg-slate-100 text-slate-600'}`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3"><MapsLink lokasi={p.lokasi} /></td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">Foto</th>
                                <th className="px-4 py-4">Tanggal</th>
                                <th className="px-4 py-4">Pengajar</th>
                                <th className="px-4 py-4">Mapel</th>
                                <th className="px-4 py-4">Mulai Mengajar</th>
                                <th className="px-4 py-4">Durasi</th>
                                <th className="px-4 py-4">Status</th>
                                <th className="px-4 py-4">Lokasi</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {sesiKelas.length === 0 ? (
                                <tr><td colSpan="8" className="text-center py-8 text-slate-400">Belum ada sesi mengajar tercatat.</td></tr>
                            ) : (
                                sesiKelas.map((s) => (
                                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-6 py-3"><PhotoThumb src={s.fotoBase64} onOpen={setPhotoModal} /></td>
                                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{s.tanggal}</td>
                                        <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">{s.pengajarNama}</td>
                                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">{s.namaMapel} · {s.paket}</td>
                                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{formatWaktu(s.startedAt)}</td>
                                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{s.durasiMenit} menit</td>
                                        <td className="px-4 py-3"><SessionStatus session={s} now={now} /></td>
                                        <td className="px-4 py-3"><MapsLink lokasi={s.lokasi} /></td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Catat Kehadiran</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2">Untuk mencatat Izin/Sakit/Alpa. WB hadir tercatat otomatis lewat presensi mandiri.</p>
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

            {photoModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-4" onClick={() => setPhotoModal(null)}>
                    <img src={photoModal} alt="Foto presensi" className="max-w-full max-h-full rounded-2xl shadow-xl" />
                </div>
            )}
        </section>
    );
};

export default PresensiPage;
