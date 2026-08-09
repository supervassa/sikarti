import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import {GuestLayout} from '../layouts/GuestLayout';
import AdminLayout from '../layouts/AdminLayout';

// Guard
import ProtectedRoute from './ProtectedRoute';

// Pages - Guest & Auth
import LandingPage from '../pages/guest/LandingPage';
import ProfilePage from '../pages/guest/ProfilePage';
import NewsPage from '../pages/guest/NewsPage';
import NewsDetail from '../pages/guest/NewsDetail';
import RegistrationPage from '../pages/guest/RegistrationPage';
import LoginPage from '../pages/auth/LoginPage';

// Pages - Superadmin Khusus
import SuperadminDashboard from '../pages/superadmin/SuperadminDashboard';
import AdminManagementPage from '../pages/superadmin/AdminManagementPage';

// Pages - Admin & Superadmin Joint Features (Tahap 5)
import WBManagementPage from '../pages/admin/WBManagementPage';
import BeritaManagementPage from '../pages/admin/BeritaManagementPage';

const AppRoutes = () => {
    return (
        <Routes>
            {/* 1. PUBLIC GUEST ROUTES (Membawa Navbar & Footer via GuestLayout) */}
            <Route element={<GuestLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/profil" element={<ProfilePage />} />
                <Route path="/berita" element={<NewsPage />} />
                <Route path="/berita/:id" element={<NewsDetail />} />
                <Route path="/daftar" element={<RegistrationPage />} />
                <Route path="/login" element={<LoginPage />} />
            </Route>

            {/* 2. RUTE SUPERADMIN KHUSUS */}
            <Route
                element={
                    <ProtectedRoute allowedRoles={['superadmin']}>
                        <AdminLayout />
                    </ProtectedRoute>
                }
            >
                <Route path="/superadmin/dashboard" element={<SuperadminDashboard />} />
                <Route path="/superadmin/admins" element={<AdminManagementPage />} />
            </Route>

            {/* 3. RUTE OPERASIONAL (ADMIN & SUPERADMIN DUAL-ACCESS) */}
            <Route
                element={
                    <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                        <AdminLayout />
                    </ProtectedRoute>
                }
            >
                <Route path="/admin/dashboard" element={<WBManagementPage />} />
                <Route path="/admin/wb" element={<WBManagementPage />} />
                <Route path="/admin/konten" element={<BeritaManagementPage />} />
            </Route>

            {/* 4. RUTE UN-AUTHORIZED & FALLBACK */}
            <Route path="/unauthorized" element={
                <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-md text-center max-w-md w-full">
                        <h1 className="text-2xl font-bold text-red-600 mb-2">Akses Ditolak</h1>
                        <p className="text-slate-600 text-sm mb-4">Anda tidak memiliki hak akses untuk membuka halaman ini.</p>
                        <a href="/" className="inline-block bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                            Kembali ke Beranda
                        </a>
                    </div>
                </div>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default AppRoutes;
