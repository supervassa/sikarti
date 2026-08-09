import React from 'react';
import { Link } from 'react-router-dom';

const NewsSection = () => {
    return (
        <section className="bg-gray-50 py-12">
            <div className="container mx-auto px-4 flex flex-col md:flex-row gap-12">
                <div className="md:w-2/3">
                    <div className="flex justify-between items-center mb-6 border-b-2 border-red-600 pb-2">
                        <h2 className="text-2xl font-bold text-gray-800">Seputar PKBM</h2>
                        <Link to="/berita" className="text-sm text-red-600 font-medium hover:underline">Lihat Semua</Link>
                    </div>
                    <div className="space-y-6">
                        <div className="flex bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
                            <div className="w-1/3 bg-gray-200 min-h-[120px] flex-shrink-0"></div>
                            <div className="p-4 w-2/3 flex flex-col justify-center">
                                <span className="text-xs font-bold text-red-600 mb-1">PENGUMUMAN</span>
                                <h3 className="font-bold text-gray-900 leading-tight mb-2">Pendaftaran Warga Belajar Baru Tahun Ajaran 2026/2027 Telah Dibuka</h3>
                                <p className="text-xs text-gray-500">09 Agustus 2026</p>
                            </div>
                        </div>
                        <div className="flex bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
                            <div className="w-1/3 bg-gray-200 min-h-[120px] flex-shrink-0"></div>
                            <div className="p-4 w-2/3 flex flex-col justify-center">
                                <span className="text-xs font-bold text-red-600 mb-1">KEGIATAN</span>
                                <h3 className="font-bold text-gray-900 leading-tight mb-2">Pelatihan Keterampilan Komputer untuk Warga Belajar Paket C</h3>
                                <p className="text-xs text-gray-500">05 Agustus 2026</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="md:w-1/3">
                    <div className="bg-[#f2efe9] p-6 rounded-lg">
                        <h3 className="font-bold text-xl text-red-700 mb-4">Akses Cepat</h3>
                        <ul className="space-y-3">
                            <li className="border-b border-gray-300 pb-2 text-sm text-gray-700 hover:text-red-600 cursor-pointer">&gt; Kalender Akademik</li>
                            <li className="border-b border-gray-300 pb-2 text-sm text-gray-700 hover:text-red-600 cursor-pointer">&gt; Jadwal Mata Pelajaran</li>
                            <li className="border-b border-gray-300 pb-2 text-sm text-gray-700 hover:text-red-600 cursor-pointer">&gt; Informasi Biaya</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default NewsSection;
