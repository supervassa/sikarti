import { getApps, initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, signOut } from 'firebase/auth';
import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db, firebaseConfig } from '../config/firebase.js';

const secondaryAppName = 'admin-account-creator';

export const getSecondaryAuth = () => {
    const app = getApps().find((item) => item.name === secondaryAppName)
        || initializeApp(firebaseConfig, secondaryAppName);
    return getAuth(app);
};

const auditData = (actor, action, targetId) => ({
    action,
    module: 'ADMIN_MANAGEMENT',
    targetId,
    targetType: 'admin',
    performedBy: actor.uid,
    performedByName: actor.nama || 'Superadmin',
    performedByEmail: actor.email || '',
    timestamp: serverTimestamp(),
    metadata: { source: 'web' },
});

const appendAudit = (batch, actor, action, targetId) => {
    const logRef = doc(collection(db, 'auditLogs'));
    batch.set(logRef, auditData(actor, action, targetId));
};

export const createAdmin = async ({ nama, username, email, password }, actor) => {
    const secondaryAuth = getSecondaryAuth();
    let createdUser;

    try {
        const credential = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), password);
        createdUser = credential.user;
        const batch = writeBatch(db);
        const userRef = doc(db, 'users', createdUser.uid);
        const adminRef = doc(db, 'admins', createdUser.uid);
        const base = {
            email: email.trim().toLowerCase(),
            nama: nama.trim(),
            username: username.trim(),
            role: 'admin',
            status: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastLogin: null,
        };

        batch.set(userRef, { ...base, kd_role: 11 });
        batch.set(adminRef, { ...base, uid: createdUser.uid });
        appendAudit(batch, actor, 'CREATE', createdUser.uid);
        await batch.commit();
        return createdUser.uid;
    } finally {
        await signOut(secondaryAuth);
    }
};

export const setAdminStatus = async (admin, actor) => {
    const nextStatus = !admin.status;
    const action = nextStatus ? 'ACTIVATE' : 'DEACTIVATE';
    const batch = writeBatch(db);

    batch.update(doc(db, 'users', admin.id), { status: nextStatus, updatedAt: serverTimestamp() });
    batch.update(doc(db, 'admins', admin.id), { status: nextStatus, updatedAt: serverTimestamp() });
    appendAudit(batch, actor, action, admin.id);
    await batch.commit();
};
