// src/layouts/GuestLayout.jsx
import { Outlet, Link } from 'react-router-dom';

export const GuestLayout = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Navbar Guest */}
            <header className="bg-white shadow border-b border-gray-200 p-4 flex justify-between items-center">
                <div className="text-2xl font-bold text-blue-700">
                    PKBM KARTINI
                </div>
                <nav className="flex items-center gap-6">
                    <Link to="/" className="text-gray-600 hover:text-blue-600 font-medium">Beranda</Link>
                    <Link to="/pendaftaran" className="text-gray-600 hover:text-blue-600 font-medium">Pendaftaran WB</Link>
                    <Link to="/login" className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-medium transition">
                        Login
                    </Link>
                </nav>
            </header>

            {/* Konten Utama */}
            <main className="flex-1 p-8">
                <Outlet />
            </main>

            {/* Footer Sederhana */}
            <footer className="bg-gray-800 text-white text-center p-4 text-sm">
                &copy; {new Date().getFullYear()} Sistem Informasi PKBM KARTINI.
            </footer>
        </div>
    );
};
