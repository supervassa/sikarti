import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Import Layouts
import { GuestLayout } from '../layouts/GuestLayout';
import { WBLayout } from '../layouts/WBLayout';
import { PengajarLayout } from '../layouts/PengajarLayout';
import { AdminLayout } from '../layouts/AdminLayout';

// Komponen pelindung rute
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, role, loading } = useAuth();

    if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

    if (!user) return <Navigate to="/login" replace />;

    if (allowedRoles && !allowedRoles.includes(role)) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export const AppRoutes = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* === RUTE GUEST (Publik) === */}
                <Route element={<GuestLayout />}>
                    <Route path="/" element={<div>Halaman Utama Guest (Beranda PKBM)</div>} />
                    <Route path="/login" element={<div>Halaman Login</div>} />
                    <Route path="/pendaftaran" element={<div>Halaman Pendaftaran Calon WB</div>} />
                </Route>

                {/* === RUTE WARGA BELAJAR === */}
                <Route
                    path="/wb"
                    element={
                        <ProtectedRoute allowedRoles={['wb']}>
                            <WBLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route path="dashboard" element={<div>Dashboard Warga Belajar</div>} />
                    <Route path="jadwal" element={<div>Jadwal Pelajaran WB</div>} />
                </Route>

                {/* === RUTE PENGAJAR === */}
                <Route
                    path="/pengajar"
                    element={
                        <ProtectedRoute allowedRoles={['pengajar']}>
                            <PengajarLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route path="dashboard" element={<div>Dashboard Pengajar</div>} />
                    <Route path="jadwal" element={<div>Jadwal Mengajar</div>} />
                </Route>

                {/* === RUTE ADMIN & SUPERADMIN === */}
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                            <AdminLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route path="dashboard" element={<div>Dashboard Admin</div>} />
                    <Route path="wb" element={<div>Manajemen Warga Belajar</div>} />
                    <Route path="pengajar" element={<div>Manajemen Pengajar</div>} />
                    <Route path="mata-pelajaran" element={<div>Manajemen Mata Pelajaran</div>} />
                    <Route path="jadwal" element={<div>Manajemen Jadwal</div>} />
                </Route>

                {/* Rute tidak ditemukan (404) */}
                <Route path="*" element={<div className="flex h-screen items-center justify-center text-2xl">404 - Halaman Tidak Ditemukan</div>} />
            </Routes>
        </BrowserRouter>
    );
};
