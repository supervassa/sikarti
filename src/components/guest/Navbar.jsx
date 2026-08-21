import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import LogoPKBM from '../../assets/logo.png';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../common/ThemeToggle';

const NAV_LINKS = [
    { to: '/', label: 'Beranda' },
    { to: '/profil', label: 'Profil' },
    { to: '/berita', label: 'Berita' },
];

const DASHBOARD_PATH_BY_ROLE = {
    superadmin: '/superadmin/dashboard',
    admin: '/admin/dashboard',
    pengajar: '/pengajar/dashboard',
    wb: '/wb/dashboard',
};

const Navbar = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const isActive = (path) => (path === '/' ? location.pathname === '/' : location.pathname.startsWith(path));

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <header className="bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-50 transition-colors">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <img src={LogoPKBM} alt="Logo PKBM KARTINI" className="w-10 h-10 object-contain"/>
                    <span className="text-xl font-bold text-gray-800 dark:text-white">PKBM KARTINI</span>
                </div>
                <nav className="hidden md:flex space-x-6 text-sm font-medium">
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className={
                                isActive(link.to)
                                    ? 'text-red-600 dark:text-red-400 font-semibold'
                                    : 'text-gray-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400'
                            }
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>
                <div className="flex items-center space-x-3">
                    <ThemeToggle />
                    {currentUser ? (
                        <div className="flex items-center space-x-3">
                            <Link
                                to={DASHBOARD_PATH_BY_ROLE[currentUser.role] || '/'}
                                className="hidden sm:inline text-sm text-gray-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 font-medium"
                            >
                                Halo, {currentUser.nama || currentUser.displayName || 'Pengguna'}
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded hover:bg-red-700"
                            >
                                Keluar
                            </button>
                        </div>
                    ) : (
                        <>
                            <Link to="/login"
                                  className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-slate-600 dark:text-slate-200 rounded hover:bg-gray-100 dark:hover:bg-slate-800">Masuk</Link>
                            <Link to="/daftar"
                                  className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded hover:bg-red-700">Daftar</Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;
