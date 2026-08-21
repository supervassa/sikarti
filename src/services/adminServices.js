import { db } from '../config/firebase';
import {
    collection,
    doc,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    deleteField,
    serverTimestamp,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { getSecondaryAuth } from './adminManagement.js';

// Password sementara acak; akun sesungguhnya diaktifkan lewat email set-password.
const generateTempPassword = () => `Tmp-${crypto.randomUUID()}`;

// Buat akun Firebase Auth + dokumen users/{uid}, lalu kirim email set-password.
const createAuthAccount = async ({ nama, email, kd_role, role, status = true, extra = {} }) => {
    const secondaryAuth = getSecondaryAuth();
    try {
        const credential = await createUserWithEmailAndPassword(secondaryAuth, email.trim().toLowerCase(), generateTempPassword());
        const uid = credential.user.uid;
        await setDoc(doc(db, 'users', uid), {
            ...extra,
            nama,
            email: email.trim().toLowerCase(),
            role,
            kd_role,
            status,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        await sendPasswordResetEmail(secondaryAuth, email.trim().toLowerCase());
        return uid;
    } finally {
        await signOut(secondaryAuth);
    }
};

// Helper Audit Log
export const createAuditLog = async (actor, action, moduleName, targetId, metadata = {}) => {
    try {
        await addDoc(collection(db, 'auditLogs'), {
            action,
            module: moduleName,
            targetId,
            targetType: moduleName.toLowerCase(),
            performedBy: actor?.uid || 'system',
            performedByName: actor?.nama || actor?.displayName || 'Admin',
            performedByEmail: actor?.email || '',
            timestamp: serverTimestamp(),
            metadata,
        });
    } catch (err) {
        console.warn('Gagal merekam audit log:', err);
    }
};

// Update field data (bukan email/status) pada dokumen users/{id}.
const updateUserRecord = async (userId, data, actor, moduleName) => {
    await updateDoc(doc(db, 'users', userId), { ...data, updatedAt: serverTimestamp() });
    await createAuditLog(actor, 'UPDATE', moduleName, userId, { nama: data.nama });
};

// Toggle status aktif/nonaktif pada dokumen users/{id}.
const toggleUserStatus = async (user, actor, moduleName) => {
    const nextStatus = !(user.status !== false);
    await updateDoc(doc(db, 'users', user.id), { status: nextStatus, updatedAt: serverTimestamp() });
    await createAuditLog(actor, nextStatus ? 'ACTIVATE' : 'DEACTIVATE', moduleName, user.id, { nama: user.nama });
    return nextStatus;
};

// Hapus dokumen profil users/{id}. Akun Firebase Auth di baliknya tidak ikut terhapus
// (butuh Admin SDK/Cloud Function) — tapi tanpa dokumen ini, AuthContext menolak login
// ("Data pengguna tidak ditemukan di sistem"), jadi akses ke aplikasi sudah tercabut.
const deleteUserRecord = async (user, actor, moduleName) => {
    await deleteDoc(doc(db, 'users', user.id));
    await createAuditLog(actor, 'DELETE', moduleName, user.id, { nama: user.nama, email: user.email });
};

// --- 1. MANAJEMEN WARGA BELAJAR (WB) ---
export const createWB = async (dataWB, actor) => {
    const { nama, email, ...extra } = dataWB;
    const uid = await createAuthAccount({ nama, email, kd_role: 22, role: 'wb', status: 'AKTIF', extra });
    await createAuditLog(actor, 'CREATE', 'MANAJEMEN_WB', uid, { nama });
    return uid;
};

// Migrasi data lama: sebelum status WB jadi 3-state, field ini boolean (true/false).
export const normalizeWBStatus = (status) => {
    if (status === 'AKTIF' || status === 'NONAKTIF' || status === 'LULUS') return status;
    return status === false ? 'NONAKTIF' : 'AKTIF';
};

// Edit data diri WB — status keanggotaan diubah lewat setWBLifecycleStatus, bukan di sini.
// Tetap sertakan status ternormalisasi supaya dokumen lama (boolean) otomatis rapi begitu diedit.
export const updateWB = (wbId, dataWB, actor, currentStatus) =>
    updateUserRecord(wbId, { ...dataWB, status: normalizeWBStatus(currentStatus) }, actor, 'MANAJEMEN_WB');

// Ubah status keanggotaan WB: AKTIF, NONAKTIF (catat tahun terakhir aktif), atau LULUS (catat tahun lulus).
export const setWBLifecycleStatus = async ({ id, status, tahunLulus, terakhirAktif }, actor) => {
    await updateDoc(doc(db, 'users', id), {
        status,
        tahunLulus: status === 'LULUS' ? tahunLulus : deleteField(),
        terakhirAktif: status === 'NONAKTIF' ? terakhirAktif : deleteField(),
        updatedAt: serverTimestamp(),
    });
    await createAuditLog(actor, 'UPDATE_STATUS', 'MANAJEMEN_WB', id, { status, tahunLulus, terakhirAktif });
};

export const deleteWB = (wb, actor) => deleteUserRecord(wb, actor, 'MANAJEMEN_WB');

// --- 2. MANAJEMEN PENGAJAR ---
export const createPengajar = async (dataPengajar, actor) => {
    const { nama, email, ...extra } = dataPengajar;
    const uid = await createAuthAccount({ nama, email, kd_role: 33, role: 'pengajar', extra });
    await createAuditLog(actor, 'CREATE', 'MANAJEMEN_PENGAJAR', uid, { nama });
    return uid;
};

export const updatePengajar = (pengajarId, dataPengajar, actor) => updateUserRecord(pengajarId, dataPengajar, actor, 'MANAJEMEN_PENGAJAR');
export const setPengajarStatus = (pengajar, actor) => toggleUserStatus(pengajar, actor, 'MANAJEMEN_PENGAJAR');
export const deletePengajar = (pengajar, actor) => deleteUserRecord(pengajar, actor, 'MANAJEMEN_PENGAJAR');

// --- 3. MANAJEMEN MATA PELAJARAN ---
export const createMapel = async (dataMapel, actor) => {
    const docRef = await addDoc(collection(db, 'subjects'), {
        ...dataMapel,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    await createAuditLog(actor, 'CREATE', 'MATA_PELAJARAN', docRef.id, { namaMapel: dataMapel.nama });
    return docRef.id;
};

export const updateMapel = async (mapelId, dataMapel, actor) => {
    await updateDoc(doc(db, 'subjects', mapelId), { ...dataMapel, updatedAt: serverTimestamp() });
    await createAuditLog(actor, 'UPDATE', 'MATA_PELAJARAN', mapelId, { namaMapel: dataMapel.nama });
};

export const deleteMapel = async (mapelId, actor) => {
    await deleteDoc(doc(db, 'subjects', mapelId));
    await createAuditLog(actor, 'DELETE', 'MATA_PELAJARAN', mapelId);
};

// --- 4. MANAJEMEN BERITA / KONTEN ---
export const createBerita = async (dataBerita, actor) => {
    const { title, deskripsi, tipeMedia, mediaType, mediaUrl, mediaBase64 } = dataBerita;

    const payload = {
        title,
        deskripsi,
        tipeMedia,
        author: actor?.nama || actor?.displayName || 'Admin',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    if (tipeMedia === 'video') {
        payload.mediaUrl = mediaUrl;
    } else {
        payload.mediaType = mediaType;
        if (mediaType === 'upload') {
            payload.mediaBase64 = mediaBase64;
        } else {
            payload.mediaUrl = mediaUrl;
        }
    }

    const docRef = await addDoc(collection(db, 'news'), payload);
    await createAuditLog(actor, 'CREATE', 'BERITA', docRef.id, { title });
    return docRef.id;
};

// --- 5. VERIFIKASI PENDAFTAR CALON WB ---
export const updatePendaftarStatus = async (pendaftarId, status, actor) => {
    const pendaftarRef = doc(db, 'registrations', pendaftarId);
    await updateDoc(pendaftarRef, {
        status, // 'APPROVED' | 'REJECTED'
        verifiedBy: actor?.uid,
        updatedAt: serverTimestamp(),
    });
    await createAuditLog(actor, 'UPDATE_STATUS', 'PENDAFTARAN', pendaftarId, { status });
};

// --- 6. MANAJEMEN JADWAL ---
export const createJadwal = async (dataJadwal, actor) => {
    const docRef = await addDoc(collection(db, 'schedules'), {
        ...dataJadwal,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    await createAuditLog(actor, 'CREATE', 'JADWAL', docRef.id, { hari: dataJadwal.hari, mapel: dataJadwal.namaMapel });
    return docRef.id;
};

export const updateJadwal = async (jadwalId, dataJadwal, actor) => {
    await updateDoc(doc(db, 'schedules', jadwalId), { ...dataJadwal, updatedAt: serverTimestamp() });
    await createAuditLog(actor, 'UPDATE', 'JADWAL', jadwalId, { hari: dataJadwal.hari, mapel: dataJadwal.namaMapel });
};

export const deleteJadwal = async (jadwalId, actor) => {
    await deleteDoc(doc(db, 'schedules', jadwalId));
    await createAuditLog(actor, 'DELETE', 'JADWAL', jadwalId);
};

// --- 7. REKAP KEHADIRAN ---
export const recordPresensi = async (dataPresensi, actor) => {
    const docRef = await addDoc(collection(db, 'presensi'), {
        ...dataPresensi,
        recordedBy: actor?.uid || 'system',
        createdAt: serverTimestamp(),
    });
    await createAuditLog(actor, 'CREATE', 'PRESENSI', docRef.id, { nama: dataPresensi.nama, status: dataPresensi.status });
    return docRef.id;
};

// --- 8. INFORMASI TAGIHAN ---
export const createTagihan = async (dataTagihan, actor) => {
    const docRef = await addDoc(collection(db, 'invoices'), {
        ...dataTagihan,
        status: dataTagihan.status || 'BELUM_LUNAS',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    await createAuditLog(actor, 'CREATE', 'TAGIHAN', docRef.id, { nama: dataTagihan.nama, jumlah: dataTagihan.jumlah });
    return docRef.id;
};

export const updateTagihanStatus = async (tagihanId, status, actor) => {
    await updateDoc(doc(db, 'invoices', tagihanId), { status, updatedAt: serverTimestamp() });
    await createAuditLog(actor, 'UPDATE_STATUS', 'TAGIHAN', tagihanId, { status });
};
