import { getApps, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getFirestore,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { auth, db, firebaseConfig } from "../config/firebase.js";

const secondaryAppName = "admin-account-creator";

// Satu instance app sekunder dipakai bersama untuk Auth & Firestore, supaya penulisan
// dokumen (mis. pendaftaran calon WB) ter-autentikasi sebagai user yang baru dibuat.
const getSecondaryApp = () =>
  getApps().find((item) => item.name === secondaryAppName) ||
  initializeApp(firebaseConfig, secondaryAppName);

export const getSecondaryAuth = () => getAuth(getSecondaryApp());
export const getSecondaryDb = () => getFirestore(getSecondaryApp());

const auditData = (actor, action, targetId) => ({
  action,
  module: "ADMIN_MANAGEMENT",
  targetId,
  targetType: "admin",
  performedBy: actor.uid,
  performedByName: actor.nama || "Superadmin",
  performedByEmail: actor.email || "",
  timestamp: serverTimestamp(),
  metadata: { source: "web" },
});

const appendAudit = (batch, actor, action, targetId) => {
  const logRef = doc(collection(db, "auditLogs"));
  batch.set(logRef, auditData(actor, action, targetId));
};

export const createAdmin = async (
  { nama, username, email, password },
  actor,
) => {
  const secondaryAuth = getSecondaryAuth();
  let createdUser;

  try {
    const credential = await createUserWithEmailAndPassword(
      secondaryAuth,
      email.trim(),
      password,
    );
    createdUser = credential.user;
    const batch = writeBatch(db);
    const userRef = doc(db, "users", createdUser.uid);
    const adminRef = doc(db, "admins", createdUser.uid);
    const base = {
      email: email.trim().toLowerCase(),
      nama: nama.trim(),
      username: username.trim(),
      role: "admin",
      status: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLogin: null,
    };

    batch.set(userRef, { ...base, kd_role: 11 });
    batch.set(adminRef, { ...base, uid: createdUser.uid });
    appendAudit(batch, actor, "CREATE", createdUser.uid);
    await batch.commit();
    return createdUser.uid;
  } finally {
    await signOut(secondaryAuth);
  }
};

export const setAdminStatus = async (admin, actor) => {
  const nextStatus = !admin.status;
  const action = nextStatus ? "ACTIVATE" : "DEACTIVATE";
  const batch = writeBatch(db);

  batch.update(doc(db, "users", admin.id), {
    status: nextStatus,
    updatedAt: serverTimestamp(),
  });
  batch.update(doc(db, "admins", admin.id), {
    status: nextStatus,
    updatedAt: serverTimestamp(),
  });
  appendAudit(batch, actor, action, admin.id);
  await batch.commit();
};

// Superadmin kirim tautan reset password ke admin. Tanpa Admin SDK kita tidak bisa
// meng-generate & menampilkan password baru, jadi dipakai email reset bawaan Firebase.
export const resetAdminPassword = async (admin, actor) => {
  await sendPasswordResetEmail(auth, (admin.email || "").trim().toLowerCase());
  await addDoc(
    collection(db, "auditLogs"),
    auditData(actor, "UPDATE", admin.id),
  );
};

// Superadmin menaikkan admin -> superadmin atau menurunkan superadmin -> admin.
// Tidak boleh mengubah role akun sendiri (rules pun menolaknya).
export const setAdminRole = async (admin, nextRole, actor) => {
  if (nextRole !== "admin" && nextRole !== "superadmin")
    throw new Error("Role tidak valid.");
  if (admin.id === actor?.uid)
    throw new Error("Anda tidak dapat mengubah role akun Anda sendiri.");

  const kdRole = nextRole === "superadmin" ? 99 : 11;
  const batch = writeBatch(db);
  batch.update(doc(db, "users", admin.id), {
    role: nextRole,
    kd_role: kdRole,
    updatedAt: serverTimestamp(),
  });
  batch.update(doc(db, "admins", admin.id), {
    role: nextRole,
    updatedAt: serverTimestamp(),
  });
  appendAudit(batch, actor, "UPDATE", admin.id);
  await batch.commit();
};
