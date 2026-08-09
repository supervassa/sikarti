import { db } from '../config/firebase';
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    serverTimestamp,
} from 'firebase/firestore';

// Helper Audit Log
const createAuditLog = async (actor, action, moduleName, targetId, metadata = {}) => {
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

// --- 1. MANAJEMEN WARGA BELAJAR (WB) ---
export const createWB = async (dataWB, actor) => {
    const docRef = await addDoc(collection(db, 'users'), {
        ...dataWB,
        role: 'wb',
        kd_role: 22,
        status: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    await createAuditLog(actor, 'CREATE', 'MANAJEMEN_WB', docRef.id, { nama: dataWB.nama });
    return docRef.id;
};

// --- 2. MANAJEMEN PENGAJAR ---
export const createPengajar = async (dataPengajar, actor) => {
    const docRef = await addDoc(collection(db, 'users'), {
        ...dataPengajar,
        role: 'pengajar',
        kd_role: 33,
        status: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    await createAuditLog(actor, 'CREATE', 'MANAJEMEN_PENGAJAR', docRef.id, { nama: dataPengajar.nama });
    return docRef.id;
};

// --- 3. MANAJEMEN MATA PELAJARAN ---
export const createMapel = async (dataMapel, actor) => {
    const docRef = await addDoc(collection(db, 'subjects'), {
        ...dataMapel,
        createdAt: serverTimestamp(),
    });
    await createAuditLog(actor, 'CREATE', 'MATA_PELAJARAN', docRef.id, { namaMapel: dataMapel.nama });
    return docRef.id;
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
