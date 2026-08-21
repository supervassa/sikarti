import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';

const STATUS_STYLE = {
    Hadir: 'bg-emerald-50 text-emerald-700',
    Izin: 'bg-blue-50 text-blue-700',
    Sakit: 'bg-amber-50 text-amber-700',
    Alpa: 'bg-rose-50 text-rose-700',
};

const RiwayatKehadiranWB = () => {
    const { currentUser } = useAuth();
    const [riwayat, setRiwayat] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'presensi'), where('wbId', '==', currentUser.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs
                .map((doc) => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
            setRiwayat(items);
            setLoading(false);
        });
        return unsubscribe;
    }, [currentUser.uid]);

    const totalHadir = riwayat.filter((r) => r.status === 'Hadir').length;
    const persentase = riwayat.length ? Math.round((totalHadir / riwayat.length) * 100) : 0;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Riwayat Kehadiran</h1>
                <p className="text-gray-500 mt-1">Rekap presensi Anda selama ini.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6 border-l-4 border-l-green-600 max-w-xs">
                <h3 className="text-gray-500 text-sm font-medium">Persentase Kehadiran</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">{persentase}%</p>
                <p className="text-xs text-gray-400 mt-1">{totalHadir} dari {riwayat.length} catatan</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b text-gray-500 text-xs uppercase font-semibold">
                    <tr>
                        <th className="px-6 py-3">Tanggal</th>
                        <th className="px-4 py-3">Status</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y">
                    {loading ? (
                        <tr><td colSpan="2" className="text-center py-8 text-gray-400">Memuat riwayat...</td></tr>
                    ) : riwayat.length === 0 ? (
                        <tr><td colSpan="2" className="text-center py-8 text-gray-400">Belum ada catatan kehadiran.</td></tr>
                    ) : (
                        riwayat.map((r) => (
                            <tr key={r.id}>
                                <td className="px-6 py-3 text-gray-700">{r.tanggal}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLE[r.status] || 'bg-gray-100 text-gray-600'}`}>
                                        {r.status}
                                    </span>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RiwayatKehadiranWB;
