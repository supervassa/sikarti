import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/guest/Navbar";
import Footer from "../../components/guest/Footer";
import {
  REGISTRATION_DEADLINE_HOURS,
  submitRegistration,
} from "../../services/registrationServices";

const EMPTY = {
  namaLengkap: "",
  nik: "",
  nisn: "",
  tempatLahir: "",
  tanggalLahir: "",
  jenisKelamin: "",
  alamat: "",
  noHp: "",
  email: "",
};

const inputCls =
  "w-full p-2 border border-gray-300 rounded focus:ring-red-500 focus:border-red-500";

const RegistrationPage = () => {
  const [formData, setFormData] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [doneEmail, setDoneEmail] = useState("");

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const { email } = await submitRegistration(formData);
      setDoneEmail(email);
    } catch (err) {
      setError(
        err.code === "auth/email-already-in-use"
          ? "Email tersebut sudah terdaftar. Silakan login, atau gunakan email lain."
          : err.code === "auth/invalid-email"
            ? "Format email tidak valid."
            : err.code === "auth/weak-password"
              ? "Terjadi kendala pembuatan akun. Coba lagi beberapa saat."
              : "Pendaftaran gagal: " + (err.message || "Silakan coba lagi."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="font-sans text-gray-800 bg-gray-50 min-h-screen flex flex-col">
      <Navbar />

      <section className="bg-red-600 py-12 md:py-16 border-b border-red-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Pendaftaran Warga Belajar
          </h1>
          <p className="text-lg text-red-100 max-w-2xl mx-auto">
            Isi data diri Anda. Setelah mendaftar, Anda akan menerima email
            untuk membuat password, lalu login untuk menyelesaikan pembayaran
            pendaftaran.
          </p>
        </div>
      </section>

      <main className="container mx-auto px-4 py-12 flex-grow">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="p-8">
            {doneEmail ? (
              <div className="text-center space-y-4">
                <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl font-bold">
                  ✓
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Pendaftaran berhasil dikirim
                </h2>
                <p className="text-sm text-gray-600 max-w-md mx-auto">
                  Kami telah mengirim email ke{" "}
                  <span className="font-semibold">{doneEmail}</span> berisi
                  tautan untuk membuat password. Buat password Anda, lalu login
                  untuk melihat tagihan dan mengunggah bukti pembayaran.
                </p>
                <p className="text-sm font-semibold text-red-600">
                  Batas waktu pembayaran: {REGISTRATION_DEADLINE_HOURS} jam
                  sejak sekarang.
                </p>
                <Link
                  to="/login"
                  className="inline-block px-6 py-2.5 bg-[#0b1f3d] text-white font-bold rounded-lg hover:bg-blue-900"
                >
                  Ke Halaman Login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 border-b-2 border-gray-100 pb-2">
                  Data Diri
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Lengkap *
                    </label>
                    <input
                      type="text"
                      name="namaLengkap"
                      required
                      value={formData.namaLengkap}
                      onChange={handleChange}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      NIK *
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      name="nik"
                      required
                      value={formData.nik}
                      onChange={handleChange}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      NISN (Opsional)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      name="nisn"
                      value={formData.nisn}
                      onChange={handleChange}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tempat Lahir *
                    </label>
                    <input
                      type="text"
                      name="tempatLahir"
                      required
                      value={formData.tempatLahir}
                      onChange={handleChange}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tanggal Lahir *
                    </label>
                    <input
                      type="date"
                      name="tanggalLahir"
                      required
                      value={formData.tanggalLahir}
                      onChange={handleChange}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jenis Kelamin *
                    </label>
                    <select
                      name="jenisKelamin"
                      required
                      value={formData.jenisKelamin}
                      onChange={handleChange}
                      className={`${inputCls} bg-white`}
                    >
                      <option value="">Pilih...</option>
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nomor HP / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      name="noHp"
                      required
                      value={formData.noHp}
                      onChange={handleChange}
                      className={inputCls}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alamat Lengkap *
                    </label>
                    <textarea
                      name="alamat"
                      rows="3"
                      required
                      value={formData.alamat}
                      onChange={handleChange}
                      className={inputCls}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Aktif *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className={inputCls}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Email ini menjadi username Anda dan tujuan tautan
                      pembuatan password.
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
                    {error}
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full md:w-auto px-8 py-3 bg-[#0b1f3d] text-white font-bold rounded-lg shadow hover:bg-blue-900 transition-colors disabled:opacity-60"
                  >
                    {submitting ? "Memproses…" : "Kirim Formulir Pendaftaran"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RegistrationPage;
