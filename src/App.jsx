// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";

import LandingPage from './pages/guest/LandingPage';
import ProfilePage from './pages/guest/ProfilePage';
import NewsPage from './pages/guest/NewsPage';
import NewsDetail from './pages/guest/NewsDetail';
import RegistrationPage from './pages/guest/RegistrationPage';
import LoginPage from './pages/auth/LoginPage';
import DashboardLayout from './components/layouts/DashboardLayout';
import AdminBoard from './components/admin/AdminBoard';
import AdminManagementPage from './pages/superadmin/AdminManagementPage';
import AuditLogPage from './pages/superadmin/AuditLogPage';
import SuperadminDashboard from './pages/superadmin/SuperadminDashboard';

// Placeholder Dashboard sementara agar tidak error 404 / loop
const DashboardSuperadmin = () => <SuperadminDashboard />;
// const DashboardAdmin = () => <h1>Dashboard Admin</h1>;
const DashboardPengajar = () => <h1>Dashboard Pengajar</h1>;
const DashboardWB = () => <h1>Dashboard Warga Belajar</h1>;
const Unauthorized = () => <h1>Akses Ditolak</h1>;

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Halaman Guest */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/profil" element={<ProfilePage />} />
                    <Route path="/berita" element={<NewsPage />} />
                    <Route path="/berita/:id" element={<NewsDetail />} />
                    <Route path="/daftar" element={<RegistrationPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/unauthorized" element={<Unauthorized />} />

                    {/* Akses Warga Belajar */}
                    <Route element={<ProtectedRoute allowedRoles={['wb']} />}>
                        <Route path="/wb/dashboard" element={<DashboardWB />} />
                    </Route>

                    {/* Akses Pengajar */}
                    <Route element={<ProtectedRoute allowedRoles={['pengajar']} />}>
                        <Route path="/pengajar/dashboard" element={<DashboardPengajar />} />
                    </Route>

                    {/* Akses Admin */}
                    <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                        <Route element={<DashboardLayout />}>
                            <Route path="/admin/dashboard" element={<AdminBoard />} />
                        </Route>
                    </Route>

                    {/* Akses Superadmin */}
                    <Route element={<ProtectedRoute allowedRoles={['superadmin']} />}>
                        <Route element={<DashboardLayout />}>
                            <Route path="/superadmin/dashboard" element={<DashboardSuperadmin />} />
                            <Route path="/superadmin/admins" element={<AdminManagementPage />} />
                            <Route path="/superadmin/audit-log" element={<AuditLogPage />} />
                        </Route>
                    </Route>
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
