import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

const WBLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();

    const menuItems = [
        { path: '/wb/dashboard', icon: '🏠', label: 'Dashboard' },
        { path: '/wb/jadwal', icon: '📅', label: 'Jadwal Pelajaran' },
        { path: '/wb/presensi', icon: '📷', label: 'Scan Presensi' },
        { path: '/wb/riwayat-kehadiran', icon: '⏱️', label: 'Riwayat Kehadiran' },
        { path: '/wb/informasi-studi', icon: '📚', label: 'Informasi Studi' },
        { path: '/wb/tagihan', icon: '💳', label: 'Tagihan' },
        { path: '/wb/profil', icon: '👤', label: 'Profil Saya' },
    ];

    return (
        <div className="flex h-screen bg-gray-100 font-sans text-gray-800">

            {/* Sidebar untuk Desktop */}
            <aside className={`bg-[#0b1f3d] text-white w-64 flex-shrink-0 hidden md:flex flex-col transition-transform duration-300`}>
                <div className="p-4 flex items-center justify-center border-b border-gray-700">
                    <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center font-bold mr-2">K</div>
                    <span className="text-lg font-bold">Portal WB</span>
                </div>
                <nav className="flex-1 overflow-y-auto py-4">
                    <ul className="space-y-1">
                        {menuItems.map((item) => (
                            <li key={item.path}>
                                <Link
                                    to={item.path}
                                    className={`flex items-center px-6 py-3 hover:bg-gray-800 transition-colors ${location.pathname === item.path ? 'bg-red-600 border-l-4 border-white' : ''}`}
                                >
                                    <span className="mr-3">{item.icon}</span>
                                    <span className="text-sm font-medium">{item.label}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
                <div className="p-4 border-t border-gray-700">
                    <button className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-gray-800 rounded transition-colors">
                        <span className="mr-3">🚪</span> Logout
                    </button>
                </div>
            </aside>

            {/* Konten Utama */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* Topbar (Mobile Hamburger & Info User) */}
                <header className="bg-white shadow-sm flex items-center justify-between px-4 py-3 z-10">
                    <div className="flex items-center">
                        {/* Tombol menu mobile (sementara kita buat tombolnya saja) */}
                        <button
                            className="md:hidden mr-4 text-gray-600 hover:text-gray-900"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        >
                            ☰
                        </button>
                        <h1 className="text-xl font-bold text-gray-800 hidden sm:block">Warga Belajar PKBM KARTINI</h1>
                    </div>
                    <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-700">Halo, Ahmad (Paket C)</span>
                        <div className="w-10 h-10 bg-gray-200 rounded-full border border-gray-300"></div>
                    </div>
                </header>

                {/* Area Konten Dinamis (Outlet) */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 md:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default WBLayout;
