// src/layouts/AdminLayout.jsx
import { Outlet, Link } from 'react-router-dom';

export const AdminLayout = () => {
    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar Admin */}
            <aside className="w-64 bg-blue-800 text-white p-5">
                <h2 className="text-2xl font-bold mb-6">SI KARTINI</h2>
                <nav className="flex flex-col gap-3">
                    <Link to="/admin/dashboard" className="hover:text-blue-300">Dashboard</Link>
                    <Link to="/admin/wb" className="hover:text-blue-300">Warga Belajar</Link>
                    <Link to="/admin/pengajar" className="hover:text-blue-300">Pengajar</Link>
                    <Link to="/admin/jadwal" className="hover:text-blue-300">Jadwal</Link>
                    {/* Tambahkan menu lain sesuai spesifikasi */}
                </nav>
            </aside>

            {/* Konten Utama */}
            <main className="flex-1 p-8 overflow-y-auto">
                {/* Outlet ini akan merender halaman sesuai rute (misal: Dashboard.jsx atau WB.jsx) */}
                <Outlet />
            </main>
        </div>
    );
};
