import { createContext, useContext, useState, useEffect } from 'react';
import {
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase.js'; // Pastikan path ke file firebase.js Anda benar

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

const ROLE_BY_CODE = {
    99: 'superadmin',
    11: 'admin',
    33: 'pengajar',
    22: 'wb',
};

const normalizeRole = (role, roleCode) => {
    if (typeof role === 'string' && role.trim()) {
        return role.trim().toLowerCase();
    }

    return ROLE_BY_CODE[Number(roleCode)] ?? null;
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fungsi untuk membaca Firestore dan update last login
    const processUserDocument = async (user) => {
        if (!user) return null;

        try {
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();
                const role = normalizeRole(userData.role, userData.kd_role);

                // Cek apakah akun aktif. Admin/Pengajar pakai status boolean;
                // WB pakai status 3-state (AKTIF/NONAKTIF/LULUS) sejak fitur status keanggotaan.
                if (userData.status === false || userData.status === 'NONAKTIF') {
                    throw new Error("Akun Anda dinonaktifkan. Silakan hubungi Admin.");
                }
                if (userData.status === 'LULUS') {
                    throw new Error("Akun Anda berstatus Lulus dan tidak lagi memiliki akses ke portal ini.");
                }

                // Catat last login ke Firestore dengan Server Timestamp
                await updateDoc(userRef, { lastLogin: serverTimestamp() });

                // Direktori admin dipakai superadmin untuk memantau login terakhir.
                // Kegagalan sinkronisasi direktori tidak boleh membatalkan sesi pengguna.
                if (role === 'admin') {
                    try {
                        await updateDoc(doc(db, 'admins', user.uid), { lastLogin: serverTimestamp() });
                    } catch (error) {
                        console.warn('Last login admin belum dapat disinkronkan:', error);
                    }
                }

                try {
                    await addDoc(collection(db, 'auditLogs'), {
                        action: 'LOGIN',
                        module: 'AUTH',
                        targetId: user.uid,
                        targetType: role || 'user',
                        performedBy: user.uid,
                        performedByName: userData.nama || user.displayName || 'Pengguna',
                        performedByEmail: user.email || '',
                        timestamp: serverTimestamp(),
                        metadata: { source: 'web' },
                    });
                } catch (error) {
                    console.warn('Audit login belum dapat dicatat:', error);
                }

                // Gabungkan data Auth dengan data Firestore (role, nama, dll)
                return {
                    uid: user.uid,
                    email: user.email,
                    ...userData,
                    role,
                };
            } else {
                throw new Error("Data pengguna tidak ditemukan di sistem.");
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            // Logout otomatis jika data tidak valid/tidak ditemukan
            await signOut(auth);
            throw error;
        }
    };

    useEffect(() => {
        // Memantau perubahan status sesi pengguna
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const fullUserData = await processUserDocument(user);
                    setCurrentUser(fullUserData);
                } catch {
                    setCurrentUser(null);
                }
            } else {
                setCurrentUser(null);
            }
            setLoading(false); // Selesai memuat sesi
        });

        return unsubscribe;
    }, []);

    const loginWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        return result;
    };

    const loginWithEmail = async (email, password) => {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return result;
    };

    const logout = async () => {
        await signOut(auth);
    };

    const value = {
        currentUser,
        // Alias agar route guard dan halaman lain memakai satu sumber data.
        user: currentUser,
        role: currentUser?.role ?? null,
        loading,
        loginWithGoogle,
        loginWithEmail,
        logout,
    };

    // Jangan render anak-anak komponen jika status Auth masih loading diproses
    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
