import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';

const formatRupiah = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0);

const TagihanWB = () => {
    const { currentUser } = useAuth();
    const [tagihan, setTagihan] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'invoices'), where('wbId', '==', currentUser.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setTagihan(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return unsubscribe;
    }, [currentUser.uid]);

    const belumLunas = tagihan.filter((t) => t.status !== 'LUNAS');
    const totalTunggakan = belumLunas.reduce((sum, t) => sum + (t.jumlah || 0), 0);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Informasi Tagihan</h1>
                <p className="text-gray-500 mt-1">Riwayat dan status pembayaran Anda.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6 border-l-4 border-l-red-600 max-w-xs">
                <h3 className="text-gray-500 text-sm font-medium">Total Tunggakan</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatRupiah(totalTunggakan)}</p>
                <p className="text-xs text-gray-400 mt-1">{belumLunas.length} tagihan belum lunas</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b text-gray-500 text-xs uppercase font-semibold">
                    <tr>
                        <th className="px-6 py-3">Keterangan</th>
                        <th className="px-4 py-3">Jumlah</th>
                        <th className="px-4 py-3">Jatuh Tempo</th>
                        <th className="px-4 py-3">Status</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y">
                    {loading ? (
                        <tr><td colSpan="4" className="text-center py-8 text-gray-400">Memuat data tagihan...</td></tr>
                    ) : tagihan.length === 0 ? (
                        <tr><td colSpan="4" className="text-center py-8 text-gray-400">Belum ada tagihan.</td></tr>
                    ) : (
                        tagihan.map((t) => (
                            <tr key={t.id}>
                                <td className="px-6 py-3 text-gray-700">{t.keterangan}</td>
                                <td className="px-4 py-3 font-semibold text-gray-800">{formatRupiah(t.jumlah)}</td>
                                <td className="px-4 py-3 text-gray-500">{t.jatuhTempo}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${t.status === 'LUNAS' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                        {t.status === 'LUNAS' ? 'Lunas' : 'Belum Lunas'}
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

export default TagihanWB;
