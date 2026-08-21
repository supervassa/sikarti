import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faGraduationCap,
    faChalkboardUser,
    faClipboardList,
    faNewspaper,
} from '@fortawesome/free-solid-svg-icons';
import { db } from '../../config/firebase';

const displayTime = (value) =>
    value?.toDate ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(value.toDate()) : '-';

const DashboardOverviewPage = () => {
    const [totalWB, setTotalWB] = useState(0);
    const [totalPengajar, setTotalPengajar] = useState(0);
    const [pendaftarPending, setPendaftarPending] = useState(0);
    const [totalBerita, setTotalBerita] = useState(0);
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        const stopWB = onSnapshot(query(collection(db, 'users'), where('kd_role', '==', 22)), (snap) => setTotalWB(snap.size));
        const stopPengajar = onSnapshot(query(collection(db, 'users'), where('kd_role', '==', 33)), (snap) => setTotalPengajar(snap.size));
        const stopPendaftar = onSnapshot(query(collection(db, 'registrations'), where('status', '==', 'PENDING')), (snap) => setPendaftarPending(snap.size));
        const stopBerita = onSnapshot(collection(db, 'news'), (snap) => setTotalBerita(snap.size));
        const stopLogs = onSnapshot(collection(db, 'auditLogs'), (snap) => {
            const items = snap.docs
                .map((item) => ({ id: item.id, ...item.data() }))
                .sort((a, b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0))
                .slice(0, 6);
            setLogs(items);
        });
        return () => { stopWB(); stopPengajar(); stopPendaftar(); stopBerita(); stopLogs(); };
    }, []);

    const cards = [
        { label: 'Warga Belajar Aktif', value: totalWB, icon: faGraduationCap, accent: 'bg-blue-50 text-blue-700' },
        { label: 'Tenaga Pengajar', value: totalPengajar, icon: faChalkboardUser, accent: 'bg-emerald-50 text-emerald-700' },
        { label: 'Pendaftar Menunggu', value: pendaftarPending, icon: faClipboardList, accent: 'bg-amber-50 text-amber-700' },
        { label: 'Berita Terpublikasi', value: totalBerita, icon: faNewspaper, accent: 'bg-rose-50 text-rose-700' },
    ];

    return (
        <section className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Ringkasan operasional PKBM KARTINI hari ini.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map((card) => (
                    <article key={card.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.accent}`}>
                            <FontAwesomeIcon icon={card.icon} className="w-4 h-4" />
                        </div>
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{card.label}</p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{card.value}</p>
                    </article>
                ))}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="font-bold text-slate-900 dark:text-white">Aktivitas Terbaru</h2>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {logs.length === 0 ? (
                        <p className="p-6 text-sm text-slate-400">Belum ada aktivitas tercatat.</p>
                    ) : (
                        logs.map((log) => (
                            <div key={log.id} className="flex gap-3 px-6 py-4">
                                <span className="mt-1 h-fit rounded-lg bg-red-50 dark:bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-700 dark:text-red-400">
                                    {log.action}
                                </span>
                                <div>
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{log.performedByName || 'Pengguna'}</p>
                                    <p className="text-xs text-slate-400">{log.module} · {displayTime(log.timestamp)}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
};

export default DashboardOverviewPage;
