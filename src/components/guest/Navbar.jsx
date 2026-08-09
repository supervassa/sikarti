import React from 'react';
import { Link } from 'react-router-dom';
import LogoPKBM from '../../assets/logo.png';

const Navbar = () => {
    return (
        <header className="bg-white shadow-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    {/* 2. Gunakan tag img dan panggil variabel LogoPKBM */}
                    <img src={LogoPKBM} alt="Logo PKBM KARTINI" className="w-10 h-10 object-contain"/>
                    <span className="text-xl font-bold text-gray-800">PKBM KARTINI</span>
                </div>
                <nav className="hidden md:flex space-x-6 text-sm font-medium">
                    <Link to="/" className="text-red-600 hover:text-red-800">Beranda</Link>
                    <Link to="/profil" className="hover:text-red-600">Profil</Link>
                    <Link to="/berita" className="hover:text-red-600">Berita</Link>
                </nav>
                <div className="flex space-x-3">
                    <Link to="/login"
                          className="px-4 py-2 text-sm font-medium border border-gray-300 rounded hover:bg-gray-100">Masuk</Link>
                    <Link to="/daftar"
                          className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded hover:bg-red-700">Daftar</Link>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
