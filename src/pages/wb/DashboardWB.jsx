import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookOpen, faCalendarCheck, faCreditCard } from '@fortawesome/free-solid-svg-icons';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';

const currentMonthPrefix = () => new Date().toISOString().slice(0, 7); // "YYYY-MM"

const DashboardWB = () => {
    const { currentUser } = useAuth();
    const [presensiBulanIni, setPresensiBulanIni] = useState([]);
    const [tagihan, setTagihan] = useState([]);

    useEffect(() => {
        const stopPresensi = onSnapshot(query(collection(db, 'presensi'), where('wbId', '==', currentUser.uid)), (snap) => {
            const bulanIni = currentMonthPrefix();
            setPresensiBulanIni(snap.docs.map((d) => d.data()).filter((p) => p.tanggal?.startsWith(bulanIni)));
        });
        const stopTagihan = onSnapshot(query(collection(db, 'invoices'), where('wbId', '==', currentUser.uid)), (snap) => {
            setTagihan(snap.docs.map((d) => d.data()));
        });
        return () => { stopPresensi(); stopTagihan(); };
    }, [currentUser.uid]);

    const totalHadir = presensiBulanIni.filter((p) => p.status === 'Hadir').length;
    const kehadiranPersen = presensiBulanIni.length ? `${Math.round((totalHadir / presensiBulanIni.length) * 100)}%` : '-';

    const belumLunas = tagihan.some((t) => t.status !== 'LUNAS');
    const statusTagihan = tagihan.length === 0 ? '-' : belumLunas ? 'Belum Lunas' : 'Lunas';
    const tagihanAccent = tagihan.length === 0
        ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
        : belumLunas
            ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400';

    const cards = [
        { label: 'Program Pendidikan', value: currentUser?.paket || '-', icon: faBookOpen, accent: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' },
        { label: 'Kehadiran Bulan Ini', value: kehadiranPersen, icon: faCalendarCheck, accent: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' },
        { label: 'Status Tagihan', value: statusTagihan, icon: faCreditCard, accent: tagihanAccent },
    ];

    return (
        <section className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard Warga Belajar</h1>
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
        </section>
    );
};

export default DashboardWB;
