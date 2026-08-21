import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';

const InformasiStudiWB = () => {
    const { currentUser } = useAuth();
    const [mapel, setMapel] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser?.paket) {
            setLoading(false);
            return;
        }
        const q = query(collection(db, 'subjects'), where('paket', '==', currentUser.paket));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMapel(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return unsubscribe;
    }, [currentUser?.paket]);

    const info = [
        { label: 'Nama Lengkap', value: currentUser?.nama || '-' },
        { label: 'Program Paket', value: currentUser?.paket || '-' },
        { label: 'Tahun Angkatan', value: currentUser?.tahunAngkatan || '-' },
        { label: 'NIK', value: currentUser?.nik || '-' },
        { label: 'Status Akun', value: currentUser?.status !== false ? 'Aktif' : 'Nonaktif' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Informasi Studi</h1>
                <p className="text-gray-500 mt-1">Ringkasan data akademik Anda di PKBM KARTINI.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {info.map((item) => (
                    <div key={item.label}>
                        <p className="text-xs text-gray-400">{item.label}</p>
                        <p className="font-semibold text-gray-800 mt-0.5">{item.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="px-6 py-4 border-b font-bold text-gray-800">Mata Pelajaran {currentUser?.paket}</div>
                <div className="divide-y">
                    {loading ? (
                        <p className="px-6 py-8 text-center text-gray-400 text-sm">Memuat data mapel...</p>
                    ) : mapel.length === 0 ? (
                        <p className="px-6 py-8 text-center text-gray-400 text-sm">Belum ada mata pelajaran terdaftar untuk paket ini.</p>
                    ) : (
                        mapel.map((m) => (
                            <div key={m.id} className="px-6 py-3 text-sm font-medium text-gray-700">{m.nama}</div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default InformasiStudiWB;
