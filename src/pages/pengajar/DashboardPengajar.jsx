import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faBookOpen, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';

const HARI_INDEX = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const sameName = (a, b) => (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase();

const DashboardPengajar = () => {
    const { currentUser } = useAuth();
    const [jadwal, setJadwal] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'schedules'), (snapshot) => {
            setJadwal(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const jadwalSaya = jadwal.filter((j) => sameName(j.pengajar, currentUser?.nama));
    const hariIni = HARI_INDEX[new Date().getDay()];
    const jadwalHariIni = jadwalSaya.filter((j) => j.hari === hariIni).sort((a, b) => a.jamMulai.localeCompare(b.jamMulai));

    const cards = [
        { label: 'Total Jadwal Mengajar', value: jadwalSaya.length, icon: faCalendarDays, accent: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' },
        { label: 'Kelas Hari Ini', value: jadwalHariIni.length, icon: faBookOpen, accent: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' },
        { label: 'Status Akun', value: currentUser?.status !== false ? 'Aktif' : 'Nonaktif', icon: faCircleCheck, accent: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' },
    ];

    return (
        <section className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard Pengajar</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Selamat datang kembali, {currentUser?.nama}!</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {cards.map((card) => (
                    <article key={card.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.accent}`}>
                            <FontAwesomeIcon icon={card.icon} className="w-4 h-4" />
                        </div>
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{card.label}</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{card.value}</p>
                    </article>
                ))}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="font-bold text-slate-900 dark:text-white">Jadwal Hari Ini ({hariIni})</h2>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {loading ? (
                        <p className="p-6 text-sm text-slate-400">Memuat jadwal...</p>
                    ) : jadwalHariIni.length === 0 ? (
                        <p className="p-6 text-sm text-slate-400">Tidak ada jadwal mengajar hari ini.</p>
                    ) : (
                        jadwalHariIni.map((j) => (
                            <div key={j.id} className="flex items-center justify-between px-6 py-4">
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-slate-100">{j.namaMapel}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{j.paket} · {j.jamMulai} - {j.jamSelesai}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
};

export default DashboardPengajar;
