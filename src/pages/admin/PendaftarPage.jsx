import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { updatePendaftarStatus } from '../../services/adminServices';

const STATUS_STYLE = {
    PENDING: 'bg-amber-50 text-amber-700',
    APPROVED: 'bg-emerald-50 text-emerald-700',
    REJECTED: 'bg-rose-50 text-rose-700',
};

const STATUS_LABEL = {
    PENDING: 'Menunggu',
    APPROVED: 'Diterima',
    REJECTED: 'Ditolak',
};

const PendaftarPage = () => {
    const { currentUser } = useAuth();
    const [pendaftar, setPendaftar] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        const q = query(collection(db, 'registrations'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setPendaftar(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        }, () => setLoading(false));
        return unsubscribe;
    }, []);

    const handleStatus = async (id, status) => {
        setProcessingId(id);
        try {
            await updatePendaftarStatus(id, status, currentUser);
        } catch (err) {
            alert('Gagal memperbarui status pendaftar: ' + err.message);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <section className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pendaftar Calon WB</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Verifikasi calon Warga Belajar yang mendaftar melalui formulir online.
                </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">Nama Lengkap</th>
                            <th className="px-4 py-4">Program</th>
                            <th className="px-4 py-4">Kontak</th>
                            <th className="px-4 py-4">Status</th>
                            <th className="px-6 py-4">Aksi</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {loading ? (
                            <tr><td colSpan="5" className="text-center py-8 text-slate-400">Memuat data pendaftar...</td></tr>
                        ) : pendaftar.length === 0 ? (
                            <tr><td colSpan="5" className="text-center py-8 text-slate-400">Belum ada calon Warga Belajar yang mendaftar.</td></tr>
                        ) : (
                            pendaftar.map((p) => {
                                const status = p.status || 'PENDING';
                                return (
                                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-100">{p.namaLengkap}</td>
                                        <td className="px-4 py-4">
                                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                {p.program || '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-xs text-slate-600 dark:text-slate-300">
                                            <p>{p.email}</p>
                                            <p className="text-slate-400">{p.noHp || '-'}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLE[status]}`}>
                                                {STATUS_LABEL[status]}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {status === 'PENDING' ? (
                                                <div className="flex gap-2">
                                                    <button
                                                        disabled={processingId === p.id}
                                                        onClick={() => handleStatus(p.id, 'APPROVED')}
                                                        className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 disabled:opacity-60"
                                                    >
                                                        Terima
                                                    </button>
                                                    <button
                                                        disabled={processingId === p.id}
                                                        onClick={() => handleStatus(p.id, 'REJECTED')}
                                                        className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 disabled:opacity-60"
                                                    >
                                                        Tolak
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400">-</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
};

export default PendaftarPage;
