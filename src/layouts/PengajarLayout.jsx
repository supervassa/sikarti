// src/layouts/PengajarLayout.jsx
import { Outlet, Link } from 'react-router-dom';

export const PengajarLayout = () => {
    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar Pengajar */}
            <aside className="w-64 bg-orange-700 text-white p-5 flex flex-col">
                <h2 className="text-2xl font-bold mb-8">Panel Pengajar</h2>

                <nav className="flex flex-col gap-4 flex-1">
                    <Link to="/pengajar/dashboard" className="hover:text-orange-200 font-medium">Dashboard</Link>
                    <Link to="/pengajar/jadwal" className="hover:text-orange-200 font-medium">Jadwal Mengajar</Link>
                    <Link to="/pengajar/profil" className="hover:text-orange-200 font-medium">Profil Saya</Link>
                </nav>

                {/* Tombol Logout (sementara mengarah ke halaman home) */}
                <div className="mt-auto pt-4 border-t border-orange-600">
                    <Link to="/" className="text-orange-200 hover:text-white font-medium">Logout</Link>
                </div>
            </aside>

            {/* Konten Utama */}
            <main className="flex-1 p-8 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
};
