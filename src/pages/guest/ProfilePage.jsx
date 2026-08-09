import React from 'react';
import Navbar from '../../components/guest/Navbar';
import Footer from '../../components/guest/Footer';

const ProfilePage = () => {
    return (
        <div className="font-sans text-gray-800 bg-gray-50 min-h-screen flex flex-col">
            <Navbar />

            {/* Header Halaman */}
            <section className="bg-[#0b1f3d] py-12 md:py-20 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-600 rounded-full translate-x-1/3 -translate-y-1/3 opacity-80 z-0"></div>
                <div className="container mx-auto px-4 relative z-10">
                    <h1 className="text-3xl md:text-5xl font-bold mb-4">Profil PKBM KARTINI</h1>
                    <p className="text-lg text-gray-300 max-w-2xl">
                        Mengenal lebih dekat pusat kegiatan belajar masyarakat yang berdedikasi untuk pendidikan non-formal inklusif dan berkualitas.
                    </p>
                </div>
            </section>

            {/* Konten Utama */}
            <main className="container mx-auto px-4 py-12 flex-grow">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

                    {/* Kolom Kiri: Sejarah & Profil */}
                    <div className="md:col-span-2 space-y-12">

                        {/* Profil Lembaga & Sejarah */}
                        <section>
                            <div className="border-l-4 border-red-600 pl-4 mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Sejarah & Profil Lembaga</h2>
                            </div>
                            <div className="prose max-w-none text-gray-700 space-y-4">
                                <p>
                                    PKBM KARTINI didirikan dengan semangat untuk memberikan akses pendidikan yang merata bagi seluruh lapisan masyarakat, terutama bagi mereka yang putus sekolah atau tidak memiliki kesempatan mengenyam pendidikan formal.
                                </p>
                                <p>
                                    Sebagai lembaga pendidikan non-formal, kami berkomitmen untuk menyelenggarakan program pembelajaran yang adaptif, inovatif, dan relevan dengan kebutuhan dunia kerja serta pengembangan karakter mandiri.
                                </p>
                            </div>
                        </section>

                        {/* Visi dan Misi */}
                        <section>
                            <div className="border-l-4 border-red-600 pl-4 mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Visi & Misi</h2>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="text-xl font-bold text-red-600 mb-3">Visi</h3>
                                <p className="text-gray-700 italic mb-6">
                                    "Mewujudkan masyarakat yang cerdas, terampil, mandiri, dan berakhlak mulia melalui pendidikan non-formal yang berkualitas."
                                </p>

                                <h3 className="text-xl font-bold text-red-600 mb-3">Misi</h3>
                                <ul className="list-disc list-inside text-gray-700 space-y-2">
                                    <li>Menyelenggarakan pendidikan kesetaraan Paket A, B, dan C yang bermutu.</li>
                                    <li>Mengembangkan program pelatihan keterampilan yang relevan dengan kebutuhan pasar.</li>
                                    <li>Membangun karakter warga belajar yang mandiri dan berjiwa wirausaha.</li>
                                    <li>Menyediakan fasilitas belajar yang memadai dan inklusif.</li>
                                </ul>
                            </div>
                        </section>

                        {/* Program Pendidikan */}
                        <section>
                            <div className="border-l-4 border-red-600 pl-4 mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Program Pendidikan</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 border-t-4 border-t-red-600">
                                    <h4 className="font-bold text-lg mb-2">Kejar Paket A</h4>
                                    <p className="text-sm text-gray-600">Pendidikan kesetaraan tingkat Sekolah Dasar (SD).</p>
                                </div>
                                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 border-t-4 border-t-[#0b1f3d]">
                                    <h4 className="font-bold text-lg mb-2">Kejar Paket B</h4>
                                    <p className="text-sm text-gray-600">Pendidikan kesetaraan tingkat Sekolah Menengah Pertama (SMP).</p>
                                </div>
                                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 border-t-4 border-t-red-600">
                                    <h4 className="font-bold text-lg mb-2">Kejar Paket C</h4>
                                    <p className="text-sm text-gray-600">Pendidikan kesetaraan tingkat Sekolah Menengah Atas (SMA).</p>
                                </div>
                                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 border-t-4 border-t-[#0b1f3d]">
                                    <h4 className="font-bold text-lg mb-2">Pendidikan Keterampilan</h4>
                                    <p className="text-sm text-gray-600">Pelatihan vokasi seperti komputer, menjahit, dan kewirausahaan.</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Kolom Kanan: Fasilitas, Pengajar, Kontak */}
                    <div className="space-y-8">

                        {/* Fasilitas */}
                        <div className="bg-[#f2efe9] p-6 rounded-xl">
                            <h3 className="font-bold text-xl text-[#0b1f3d] mb-4 border-b-2 border-red-600 pb-2">Fasilitas Lembaga</h3>
                            <ul className="space-y-3 text-sm text-gray-700">
                                <li className="flex items-center space-x-2">
                                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                                    <span>Ruang Kelas Nyaman</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                                    <span>Laboratorium Komputer</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                                    <span>Perpustakaan Mini</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                                    <span>Ruang Praktik Keterampilan</span>
                                </li>
                                <li className="flex items-center space-x-2">
                                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                                    <span>Akses Wi-Fi Gratis</span>
                                </li>
                            </ul>
                        </div>

                        {/* Informasi Pengajar */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="font-bold text-xl text-[#0b1f3d] mb-4 border-b-2 border-red-600 pb-2">Tim Pengajar</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Didukung oleh tenaga pendidik profesional, bersertifikasi, dan berpengalaman dalam pendidikan kesetaraan.
                            </p>
                            <button className="text-red-600 font-medium text-sm hover:underline">
                                Lihat Daftar Pengajar &rarr;
                            </button>
                        </div>

                        {/* Kontak */}
                        <div className="bg-[#0b1f3d] text-white p-6 rounded-xl shadow-md">
                            <h3 className="font-bold text-xl mb-4 border-b-2 border-red-600 pb-2">Hubungi Kami</h3>
                            <div className="space-y-3 text-sm text-gray-300">
                                <p><strong className="text-white">Alamat:</strong><br/>Jl. Pendidikan No. 123, Kota, Indonesia</p>
                                <p><strong className="text-white">Telepon:</strong><br/>+62 812 3456 7890</p>
                                <p><strong className="text-white">Email:</strong><br/>info@pkbmkartini.ac.id</p>
                            </div>
                        </div>

                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ProfilePage;
