import { db } from '../config/firebase';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { createAuditLog } from './adminServices';

export const classSessionId = (scheduleId, tanggal) => `${scheduleId}_${tanggal}`;

const diffMinutes = (jamMulai, jamSelesai) => {
    const [h1, m1] = jamMulai.split(':').map(Number);
    const [h2, m2] = jamSelesai.split(':').map(Number);
    return (h2 * 60 + m2) - (h1 * 60 + m1);
};

// Pengajar tap "Mulai Mengajar": buka jendela presensi WB untuk jadwal ini hari ini,
// sekaligus foto+lokasi yang dikirim jadi bukti kehadiran pengajar sendiri.
// ID dokumen deterministik ({scheduleId}_{tanggal}) + transaksi create-if-absent
// mencegah sesi dobel kalau tombolnya kepencet dua kali / direfresh.
export const startClassSession = async (schedule, tanggal, currentUser, { fotoBase64, lokasi }) => {
    const id = classSessionId(schedule.id, tanggal);
    const ref = doc(db, 'classSessions', id);
    const durasiMenit = diffMinutes(schedule.jamMulai, schedule.jamSelesai);

    await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (snap.exists()) {
            throw new Error('Sesi untuk kelas ini sudah dimulai sebelumnya.');
        }
        tx.set(ref, {
            scheduleId: schedule.id,
            namaMapel: schedule.namaMapel,
            paket: schedule.paket,
            hari: schedule.hari,
            tanggal,
            durasiMenit,
            pengajarId: currentUser.uid,
            pengajarNama: currentUser.nama,
            lokasi,
            fotoBase64,
            startedAt: serverTimestamp(),
        });
    });

    await createAuditLog(currentUser, 'CREATE', 'SESI_KELAS', id, { namaMapel: schedule.namaMapel, tanggal });
    return id;
};
