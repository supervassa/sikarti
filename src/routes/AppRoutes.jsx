import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Layouts
import { GuestLayout } from "../layouts/GuestLayout";
import AdminLayout from "../layouts/AdminLayout";

// Guard
import ProtectedRoute from "./ProtectedRoute";

// Pages - Guest & Auth
import LandingPage from "../pages/guest/LandingPage";
import ProfilePage from "../pages/guest/ProfilePage";
import ContactPage from "../pages/guest/ContactPage";
import NewsPage from "../pages/guest/NewsPage";
import NewsDetail from "../pages/guest/NewsDetail";
import RegistrationPage from "../pages/guest/RegistrationPage";
import LoginPage from "../pages/auth/LoginPage";

// Pages - Superadmin Khusus
import SuperadminDashboard from "../pages/superadmin/SuperadminDashboard";
import AdminManagementPage from "../pages/superadmin/AdminManagementPage";

// Pages - Admin & Superadmin Joint Features (Tahap 5)
import DashboardOverviewPage from "../pages/admin/DashboardOverviewPage";
import WBManagementPage from "../pages/admin/WBManagementPage";
import WBDetailPage from "../pages/admin/WBDetailPage";
import PengajarManagementPage from "../pages/admin/PengajarManagementPage";
import MapelPage from "../pages/admin/MapelPage";
import JadwalPage from "../pages/admin/JadwalPage";
import PendaftarPage from "../pages/admin/PendaftarPage";
import BeritaManagementPage from "../pages/admin/BeritaManagementPage";
import PresensiPage from "../pages/admin/PresensiPage";
import KeuanganPage from "../pages/admin/KeuanganPage";
import WBLayout from "../layouts/WBLayout.jsx";
import DashboardWB from "../pages/wb/DashboardWB.jsx";
import JadwalWB from "../pages/wb/JadwalWB.jsx";
import PresensiWB from "../pages/wb/PresensiWB.jsx";
import RiwayatKehadiranWB from "../pages/wb/RiwayatKehadiranWB.jsx";
import InformasiStudiWB from "../pages/wb/InformasiStudiWB.jsx";
import TagihanWB from "../pages/wb/TagihanWB.jsx";
import ProfilWB from "../pages/wb/ProfilWB.jsx";
import PengajarLayout from "../layouts/PengajarLayout.jsx";
import DashboardPengajar from "../pages/pengajar/DashboardPengajar.jsx";
import JadwalPengajar from "../pages/pengajar/JadwalPengajar.jsx";
import ProfilPengajar from "../pages/pengajar/ProfilPengajar.jsx";
import CalonWBLayout from "../layouts/CalonWBLayout.jsx";
import CalonLoginPage from "../pages/calon/CalonLoginPage.jsx";
import TagihanPendaftaranPage from "../pages/calon/TagihanPendaftaranPage.jsx";
import CalonWBProfilPage from "../pages/calon/CalonWBProfilPage.jsx";

const AppRoutes = () => {
  return (
    <Routes>
      {/* 1. PUBLIC GUEST ROUTES (Membawa Navbar & Footer via GuestLayout) */}
      <Route element={<GuestLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/profil" element={<ProfilePage />} />
        <Route path="/kontak" element={<ContactPage />} />
        <Route path="/berita" element={<NewsPage />} />
        <Route path="/berita/:id" element={<NewsDetail />} />
        <Route path="/daftar" element={<RegistrationPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/pendaftaran/login" element={<CalonLoginPage />} />
      </Route>

      {/* 2. RUTE SUPERADMIN KHUSUS */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["superadmin"]}>
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
          <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin/dashboard" element={<DashboardOverviewPage />} />
        <Route path="/admin/wb" element={<WBManagementPage />} />
        <Route path="/admin/wb/:wbId" element={<WBDetailPage />} />
        <Route path="/admin/pengajar" element={<PengajarManagementPage />} />
        <Route path="/admin/mapel" element={<MapelPage />} />
        <Route path="/admin/jadwal" element={<JadwalPage />} />
        <Route
          path="/admin/akademik"
          element={<Navigate to="/admin/mapel" replace />}
        />
        <Route path="/admin/pendaftar" element={<PendaftarPage />} />
        <Route path="/admin/konten" element={<BeritaManagementPage />} />
        <Route path="/admin/presensi" element={<PresensiPage />} />
        <Route path="/admin/keuangan" element={<KeuanganPage />} />
      </Route>

      {/* 4. RUTE UN-AUTHORIZED & FALLBACK */}
      <Route
        path="/unauthorized"
        element={
          <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-md text-center max-w-md w-full">
              <h1 className="text-2xl font-bold text-red-600 mb-2">
                Akses Ditolak
              </h1>
              <p className="text-slate-600 text-sm mb-4">
                Anda tidak memiliki hak akses untuk membuka halaman ini.
              </p>
              <a
                href="/"
                className="inline-block bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-semibold"
              >
                Kembali ke Beranda
              </a>
            </div>
          </div>
        }
      />

      {/* AREA WARGA BELAJAR (WB) */}
      <Route element={<ProtectedRoute allowedRoles={["wb"]} />}>
        <Route path="/wb" element={<WBLayout />}>
          <Route path="dashboard" element={<DashboardWB />} />
          <Route path="jadwal" element={<JadwalWB />} />
          <Route path="presensi" element={<PresensiWB />} />
          <Route path="riwayat-kehadiran" element={<RiwayatKehadiranWB />} />
          <Route path="informasi-studi" element={<InformasiStudiWB />} />
          <Route path="tagihan" element={<TagihanWB />} />
          <Route path="profil" element={<ProfilWB />} />
        </Route>
      </Route>
      {/* AREA PENGAJAR */}
      <Route element={<ProtectedRoute allowedRoles={["pengajar"]} />}>
        <Route path="/pengajar" element={<PengajarLayout />}>
          <Route path="dashboard" element={<DashboardPengajar />} />
          <Route path="jadwal" element={<JadwalPengajar />} />
          <Route path="profil" element={<ProfilPengajar />} />
        </Route>
      </Route>

      {/* AREA CALON WARGA BELAJAR (pra-aktivasi: pembayaran & lengkapi profil) */}
      <Route element={<ProtectedRoute allowedRoles={["calon_wb"]} />}>
        <Route path="/pendaftaran" element={<CalonWBLayout />}>
          <Route index element={<Navigate to="tagihan" replace />} />
          <Route path="tagihan" element={<TagihanPendaftaranPage />} />
          <Route path="profil" element={<CalonWBProfilPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
