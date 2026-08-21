import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { checkinPresensi, hasCheckedInToday } from '../../services/wbServices';

const PresensiWB = () => {
    const { currentUser } = useAuth();
    const [checkedIn, setCheckedIn] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        let active = true;
        hasCheckedInToday(currentUser.uid).then((result) => {
            if (active) {
                setCheckedIn(result);
                setLoading(false);
            }
        });
        return () => { active = false; };
    }, [currentUser.uid]);

    const handleCheckin = async () => {
        setSaving(true);
        setMessage('');
        try {
            await checkinPresensi(currentUser);
            setCheckedIn(true);
        } catch (err) {
            setMessage('Gagal mencatat presensi: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const today = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

    return (
        <div className="space-y-6 max-w-lg">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Presensi</h1>
                <p className="text-gray-500 mt-1">Tandai kehadiran Anda untuk hari ini.</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center space-y-4">
                <p className="text-sm text-gray-500">{today}</p>
                {loading ? (
                    <p className="text-gray-400 text-sm">Memeriksa status presensi...</p>
                ) : checkedIn ? (
                    <>
                        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl">✓</div>
                        <p className="font-semibold text-emerald-700">Anda sudah presensi hari ini.</p>
                    </>
                ) : (
                    <>
                        <button
                            onClick={handleCheckin}
                            disabled={saving}
                            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg disabled:opacity-60"
                        >
                            {saving ? 'Memproses...' : 'Hadir Hari Ini'}
                        </button>
                        <p className="text-xs text-gray-400">Klik tombol di atas saat Anda hadir di kelas.</p>
                    </>
                )}
                {message && <p className="text-sm text-rose-600">{message}</p>}
            </div>
        </div>
    );
};

export default PresensiWB;
