import React, { useState } from 'react';
import Navbar from '../../components/guest/Navbar';
import Footer from '../../components/guest/Footer';

const RegistrationPage = () => {
    const [formData, setFormData] = useState({
        namaLengkap: '',
        nik: '',
        nisn: '',
        tempatLahir: '',
        tanggalLahir: '',
        jenisKelamin: '',
        alamat: '',
        noHp: '',
        email: '',
        namaWali: '',
        noHpWali: '',
        program: '',
        tahunPendaftaran: '2026/2027',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // TODO: Implementasi logika submit ke Firestore dan Firebase Storage
        alert('Pendaftaran berhasil disubmit! Menunggu konfirmasi admin.');
    };

    return (
        <div className="font-sans text-gray-800 bg-gray-50 min-h-screen flex flex-col">
            <Navbar />

            {/* Header */}
            <section className="bg-red-600 py-12 md:py-16 border-b border-red-700 text-white">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-3xl md:text-5xl font-bold mb-4">Pendaftaran Warga Belajar</h1>
                    <p className="text-lg text-red-100 max-w-2xl mx-auto">
                        Mari bergabung bersama PKBM KARTINI. Isi formulir di bawah ini dengan data yang valid dan benar.
                    </p>
                </div>
            </section>

            {/* Konten Form */}
            <main className="container mx-auto px-4 py-12 flex-grow">
                <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">

                    <div className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-8">

                            {/* Bagian 1: Data Pribadi */}
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 border-b-2 border-gray-100 pb-2 mb-4">1. Data Pribadi</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
                                        <input type="text" name="namaLengkap" required onChange={handleChange} className="w-full p-2 border border-gray-300 rounded focus:ring-red-500 focus:border-red-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">NIK *</label>
                                        <input type="number" name="nik" required onChange={handleChange} className="w-full p-2 border border-gray-300 rounded focus:ring-red-500 focus:border-red-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">NISN (Opsional)</label>
                                        <input type="number" name="nisn" onChange={handleChange} className="w-full p-2 border border-gray-300 rounded focus:ring-red-500 focus:border-red-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tempat Lahir *</label>
                                        <input type="text" name="tempatLahir" required onChange={handleChange} className="w-full p-2 border border-gray-300 rounded focus:ring-red-500 focus:border-red-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Lahir *</label>
                                        <input type="date" name="tanggalLahir" required onChange={handleChange} className="w-full p-2 border border-gray-300 rounded focus:ring-red-500 focus:border-red-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin *</label>
                                        <select name="jenisKelamin" required onChange={handleChange} className="w-full p-2 border border-gray-300 rounded focus:ring-red-500 focus:border-red-500 bg-white">
                                            <option value="">Pilih...</option>
                                            <option value="L">Laki-laki</option>
                                            <option value="P">Perempuan</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nomor HP / WhatsApp *</label>
                                        <input type="tel" name="noHp" required onChange={handleChange} className="w-full p-2 border border-gray-300 rounded focus:ring-red-500 focus:border-red-500" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap *</label>
                                        <textarea name="alamat" rows="3" required onChange={handleChange} className="w-full p-2 border border-gray-300 rounded focus:ring-red-500 focus:border-red-500"></textarea>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Aktif *</label>
                                        <input type="email" name="email" required onChange={handleChange} className="w-full p-2 border border-gray-300 rounded focus:ring-red-500 focus:border-red-500" />
                                    </div>
                                </div>
                            </div>

                            {/* Bagian 2: Data Orang Tua / Wali */}
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 border-b-2 border-gray-100 pb-2 mb-4">2. Data Orang Tua / Wali</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Orang Tua / Wali *</label>
                                        <input type="text" name="namaWali" required onChange={handleChange} className="w-full p-2 border border-gray-300 rounded focus:ring-red-500 focus:border-red-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nomor HP Orang Tua / Wali *</label>
                                        <input type="tel" name="noHpWali" required onChange={handleChange} className="w-full p-2 border border-gray-300 rounded focus:ring-red-500 focus:border-red-500" />
                                    </div>
                                </div>
                            </div>

                            {/* Bagian 3: Program Akademik */}
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 border-b-2 border-gray-100 pb-2 mb-4">3. Program Pendidikan</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Pilihan Program *</label>
                                        <select name="program" required onChange={handleChange} className="w-full p-2 border border-gray-300 rounded focus:ring-red-500 focus:border-red-500 bg-white">
                                            <option value="">Pilih Program...</option>
                                            <option value="Paket A">Kejar Paket A (Setara SD)</option>
                                            <option value="Paket B">Kejar Paket B (Setara SMP)</option>
                                            <option value="Paket C">Kejar Paket C (Setara SMA)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Pendaftaran</label>
                                        <input type="text" name="tahunPendaftaran" value="2026/2027" disabled className="w-full p-2 border border-gray-200 bg-gray-100 text-gray-500 rounded cursor-not-allowed" />
                                    </div>
                                </div>
                            </div>

                            {/* Bagian 4: Dokumen & Pembayaran */}
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 border-b-2 border-gray-100 pb-2 mb-4">4. Unggah Dokumen</h2>
                                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                                    <p className="text-sm text-blue-700">Pastikan file yang diunggah memiliki format .JPG, .PNG, atau .PDF dengan ukuran maksimal 2MB per file.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Pas Foto (3x4 / 4x6) *</label>
                                        <input type="file" accept="image/*" required className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Dokumen Pendukung (KK / Ijazah) *</label>
                                        <input type="file" accept=".pdf,image/*" required className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Bukti Pembayaran Pendaftaran *</label>
                                        <p className="text-xs text-gray-500 mb-2">Silakan transfer biaya pendaftaran ke Rekening BCA 1234567890 a/n PKBM KARTINI dan unggah buktinya di sini.</p>
                                        <input type="file" accept="image/*,.pdf" required className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100" />
                                    </div>
                                </div>
                            </div>

                            {/* Tombol Submit */}
                            <div className="pt-6 border-t border-gray-200">
                                <button type="submit" className="w-full md:w-auto px-8 py-3 bg-[#0b1f3d] text-white font-bold rounded-lg shadow hover:bg-blue-900 transition-colors">
                                    Kirim Formulir Pendaftaran
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default RegistrationPage;
