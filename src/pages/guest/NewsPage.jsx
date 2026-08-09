import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/guest/Navbar';
import Footer from '../../components/guest/Footer';

const NewsPage = () => {
    // Data dummy sementara (nantinya akan diambil dari Firestore)
    const dummyNews = [
        {
            id: 1,
            type: 'PENGUMUMAN',
            title: 'Pendaftaran Warga Belajar Baru Tahun Ajaran 2026/2027 Telah Dibuka',
            date: '09 Agustus 2026',
            excerpt: 'PKBM KARTINI kembali membuka pendaftaran untuk warga belajar baru untuk program Kejar Paket A, B, dan C. Simak syarat dan ketentuannya di sini.',
            image: null // Placeholder
        },
        {
            id: 2,
            type: 'KEGIATAN',
            title: 'Pelatihan Keterampilan Komputer untuk Warga Belajar Paket C',
            date: '05 Agustus 2026',
            excerpt: 'Dalam rangka membekali keterampilan digital, PKBM KARTINI mengadakan pelatihan komputer dasar bagi seluruh warga belajar tingkat SMA.',
            image: null
        },
        {
            id: 3,
            type: 'BERITA',
            title: 'Kunjungan Dinas Pendidikan ke Fasilitas PKBM KARTINI',
            date: '01 Agustus 2026',
            excerpt: 'Dinas Pendidikan setempat melakukan kunjungan rutin untuk memantau kelayakan fasilitas dan proses belajar mengajar di lingkungan PKBM.',
            image: null
        }
    ];

    return (
        <div className="font-sans text-gray-800 bg-gray-50 min-h-screen flex flex-col">
            <Navbar />

            <section className="bg-white py-12 md:py-16 border-b border-gray-200">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">Berita & Informasi</h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Dapatkan pembaruan terbaru seputar kegiatan, pengumuman akademik, dan pencapaian warga belajar PKBM KARTINI.
                    </p>
                </div>
            </section>

            <main className="container mx-auto px-4 py-12 flex-grow">
                <div className="max-w-4xl mx-auto space-y-8">

                    {dummyNews.map((news) => (
                        <Link key={news.id} to={`/berita/${news.id}`} className="block group">
                            <div className="flex flex-col md:flex-row bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 transition-all hover:shadow-md hover:border-red-200">
                                {/* Thumbnail */}
                                <div className="md:w-1/3 bg-gray-200 min-h-[200px] flex-shrink-0 flex items-center justify-center text-gray-400">
                                    [Thumbnail {news.type}]
                                </div>

                                {/* Konten Text */}
                                <div className="p-6 md:w-2/3 flex flex-col justify-center">
                                    <div className="flex items-center space-x-3 mb-2">
                    <span className="px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full">
                      {news.type}
                    </span>
                                        <span className="text-sm text-gray-500">{news.date}</span>
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900 leading-tight mb-3 group-hover:text-red-600 transition-colors">
                                        {news.title}
                                    </h2>
                                    <p className="text-gray-600 text-sm line-clamp-2">
                                        {news.excerpt}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}

                </div>
            </main>

            <Footer />
        </div>
    );
};

export default NewsPage;
