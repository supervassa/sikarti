import { db } from '../config/firebase';
import { addDoc, collection, doc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { createAuditLog } from './adminServices';

const todayISO = () => new Date().toISOString().slice(0, 10);

export const hasCheckedInToday = async (uid) => {
    const q = query(collection(db, 'presensi'), where('wbId', '==', uid), where('tanggal', '==', todayISO()));
    const snap = await getDocs(q);
    return !snap.empty;
};

// Presensi mandiri: WB tandai hadir sendiri (tanpa QR/lokasi, sesuai keputusan MVP).
export const checkinPresensi = async (currentUser) => {
    const docRef = await addDoc(collection(db, 'presensi'), {
        wbId: currentUser.uid,
        nama: currentUser.nama,
        status: 'Hadir',
        tanggal: todayISO(),
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
