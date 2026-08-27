import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';

const HARI_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'minggu'];

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
        <section className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Jadwal Pelajaran</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Jadwal kegiatan belajar mingguan PKBM KARTINI.</p>
            </div>

            {loading ? (
                <p className="text-sm text-slate-400">Memuat jadwal...</p>
            ) : grouped.length === 0 ? (
                <p className="text-sm text-slate-400">Jadwal belum tersedia.</p>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {grouped.map((g) => (
                        <div key={g.hari} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="bg-red-600 text-white px-4 py-2.5 font-semibold text-sm">{g.hari}</div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {g.items.map((item) => (
                                    <div key={item.id} className="px-4 py-3">
                                        <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{item.namaMapel}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                            {item.jamMulai} - {item.jamSelesai}{item.pengajar ? ` · ${item.pengajar}` : ''}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

export default JadwalWB;
