import React from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../../components/guest/Navbar';
import Footer from '../../components/guest/Footer';

const NewsDetail = () => {
    // Mengambil ID dari URL
    const { id } = useParams();

    return (
        <div className="font-sans text-gray-800 bg-white min-h-screen flex flex-col">
            <Navbar />

            <main className="container mx-auto px-4 py-10 flex-grow">
                <article className="max-w-3xl mx-auto">

                    {/* Breadcrumb */}
                    <nav className="mb-8 text-sm text-gray-500">
                        <Link to="/" className="hover:text-red-600">Beranda</Link>
                        <span className="mx-2">&gt;</span>
                        <Link to="/berita" className="hover:text-red-600">Berita</Link>
                        <span className="mx-2">&gt;</span>
                        <span className="text-gray-900">Detail (ID: {id})</span>
                    </nav>

                    {/* Header Artikel */}
                    <header className="mb-10 text-center">
            <span className="inline-block px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full mb-4">
              PENGUMUMAN
            </span>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4">
                            Pendaftaran Warga Belajar Baru Tahun Ajaran 2026/2027 Telah Dibuka
                        </h1>
                        <p className="text-sm text-gray-500">Dipublikasikan pada 09 Agustus 2026</p>
                    </header>

                    {/* Gambar Hero Artikel */}
                    <div className="w-full h-64 md:h-96 bg-gray-200 rounded-2xl mb-10 flex items-center justify-center text-gray-400">
                        [Gambar / Banner Utama Artikel]
                    </div>

                    {/* Isi Artikel (Prose) */}
                    <div className="prose max-w-none text-gray-700 space-y-4">
                        <p className="lead text-lg font-medium">
                            PKBM KARTINI dengan bangga mengumumkan bahwa pendaftaran untuk warga belajar baru tahun ajaran 2026/2027 telah resmi dibuka.
                        </p>
                        <p>
                            Program kesetaraan yang kami tawarkan meliputi Kejar Paket A (Setara SD), Paket B (Setara SMP), dan Paket C (Setara SMA). Kami berkomitmen untuk memberikan layanan pendidikan non-formal yang inklusif dan berkualitas bagi seluruh lapisan masyarakat yang membutuhkan akses pendidikan lanjutan.
                        </p>
                        <h3 className="text-xl font-bold text-gray-900 mt-6 mb-2">Persyaratan Pendaftaran:</h3>
                        <ul className="list-disc list-inside space-y-2">
                            <li>Fotokopi Kartu Keluarga (KK) dan Akta Kelahiran.</li>
                            <li>Fotokopi Ijazah terakhir (bagi pendaftar Paket B dan C).</li>
                            <li>Pas foto ukuran 3x4 dan 4x6 (masing-masing 3 lembar).</li>
                            <li>Mengisi formulir pendaftaran secara online atau datang langsung ke sekretariat.</li>
                        </ul>
                        <p className="mt-6">
                            Bagi Anda yang berminat, silakan langsung menuju halaman pendaftaran atau menghubungi kontak yang tertera di website kami. Kuota kelas sangat terbatas!
                        </p>

                        {/* Embed Video Placeholder */}
                        <div className="my-8 aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 border border-gray-200">
                            [Area Embed YouTube Player]
                        </div>
                    </div>

                </article>
            </main>

            <Footer />
        </div>
    );
};

export default NewsDetail;
