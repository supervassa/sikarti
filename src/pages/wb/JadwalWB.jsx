import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';

const HARI_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const JadwalWB = () => {
    const [jadwal, setJadwal] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'schedules'), (snapshot) => {
            setJadwal(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const grouped = HARI_ORDER
        .map((hari) => ({
            hari,
            items: jadwal.filter((j) => j.hari === hari).sort((a, b) => a.jamMulai.localeCompare(b.jamMulai)),
        }))
        .filter((g) => g.items.length > 0);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Jadwal Pelajaran</h1>
                <p className="text-gray-500 mt-1">Jadwal kegiatan belajar mingguan PKBM KARTINI.</p>
            </div>

            {loading ? (
                <p className="text-gray-400 text-sm">Memuat jadwal...</p>
            ) : grouped.length === 0 ? (
                <p className="text-gray-400 text-sm">Jadwal belum tersedia.</p>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {grouped.map((g) => (
                        <div key={g.hari} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                            <div className="bg-[#0b1f3d] text-white px-4 py-2.5 font-semibold text-sm">{g.hari}</div>
                            <div className="divide-y">
                                {g.items.map((item) => (
                                    <div key={item.id} className="px-4 py-3">
                                        <p className="font-semibold text-gray-800 text-sm">{item.namaMapel}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {item.jamMulai} - {item.jamSelesai}{item.pengajar ? ` · ${item.pengajar}` : ''}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default JadwalWB;
