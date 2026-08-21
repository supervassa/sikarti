import { db } from '../config/firebase';
import { addDoc, collection, doc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { createAuditLog } from './adminServices';

export const todayISO = () => new Date().toISOString().slice(0, 10);

// Sudah presensi untuk sesi kelas tertentu (bukan "sudah presensi hari ini" secara umum —
// satu WB bisa punya beberapa jadwal/sesi berbeda di hari yang sama).
export const hasCheckedInForSession = async (uid, sessionId) => {
    const q = query(collection(db, 'presensi'), where('wbId', '==', uid), where('sessionId', '==', sessionId));
    const snap = await getDocs(q);
    return !snap.empty;
};

// Presensi mandiri WB: hanya bisa selama sesi kelas (classSessions) masih aktif — lihat
// firestore.rules isClassSessionActive. Wajib foto+lokasi dari CaptureAttendanceModal.
export const checkinPresensi = async (currentUser, session, { fotoBase64, lokasi }) => {
    const docRef = await addDoc(collection(db, 'presensi'), {
        wbId: currentUser.uid,
        nama: currentUser.nama,
        status: 'Hadir',
        tanggal: todayISO(),
        sessionId: session.id,
        namaMapel: session.namaMapel,
        lokasi,
        fotoBase64,
        recordedBy: currentUser.uid,
        createdAt: serverTimestamp(),
    });
    await createAuditLog(currentUser, 'CREATE', 'PRESENSI', docRef.id, { nama: currentUser.nama, status: 'Hadir', selfCheckin: true });
    return docRef.id;
};

// WB hanya boleh ubah nomor HP sendiri (lihat firestore.rules: isValidSelfContactUpdate).
export const updateOwnContact = async (uid, noHp, currentUser) => {
    await updateDoc(doc(db, 'users', uid), { noHp, updatedAt: serverTimestamp() });
    await createAuditLog(currentUser, 'UPDATE', 'PROFIL_WB', uid, { noHp });
};
