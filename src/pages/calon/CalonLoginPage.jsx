import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import LogoPKBM from "../../assets/logo.png";

// Login khusus calon Warga Belajar (pra-aktivasi) yang sudah membuat password
// lewat tautan email pendaftaran. Akun non-calon ditolak di sini.
const CalonLoginPage = () => {
  const navigate = useNavigate();
  const { loginWithEmail, currentUser, authError, clearAuthError } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [localErr, setLocalErr] = useState("");

  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  // Calon -> halaman tagihan. Akun lain -> login utama (yang akan mengarahkan
  // ke dashboard sesuai perannya). Jadi halaman ini efektif hanya untuk calon.
  useEffect(() => {
    if (!currentUser) return;
    navigate(
      currentUser.role === "calon_wb" ? "/pendaftaran/tagihan" : "/login",
      { replace: true },
    );
  }, [currentUser, navigate]);

  const shownError = localErr || authError;
  const busy = loading && !currentUser && !authError;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLocalErr("");
    clearAuthError();
    try {
      await loginWithEmail(email.trim().toLowerCase(), password);
      // Redirect diurus useEffect saat currentUser terisi.
    } catch {
      setLocalErr(
        "Email atau password salah. Jika Anda baru mendaftar, buat password dulu lewat tautan di email pendaftaran.",
      );
      setLoading(false);
    }
  };

  const openReset = () => {
    setResetEmail(email);
    setResetSent(false);
    setResetOpen(true);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim().toLowerCase());
    } catch {
      // Pesan generik dijaga sama walau email tidak terdaftar.
    } finally {
      setResetSent(true);
    }
  };

  return (
    <div className="font-sans text-gray-800 bg-gray-50 min-h-screen flex flex-col justify-center items-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-[#0b1f3d] py-6 px-8 flex flex-col items-center">
          <img
            src={LogoPKBM}
            alt="Logo PKBM KARTINI"
            className="w-16 h-16 object-contain mb-3 bg-white rounded-full p-1"
          />
          <h2 className="text-2xl font-bold text-white text-center">
            Login Calon Pendaftar
          </h2>
          <p className="text-sm text-gray-300 mt-1 text-center">
            Untuk calon Warga Belajar yang sudah membuat password.
          </p>
        </div>

        <div className="p-8 space-y-6">
          {shownError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-200">
              {shownError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                placeholder="email saat mendaftar"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={openReset}
                  className="text-xs font-medium text-amber-600 hover:text-amber-500"
                >
                  Lupa / kirim ulang?
                </button>
              </div>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className={`w-full py-2.5 px-4 bg-amber-600 text-white font-bold rounded-lg shadow-md hover:bg-amber-700 transition-all ${
                busy ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {busy ? "Memproses..." : "Masuk"}
            </button>
          </form>
        </div>

        <div className="bg-gray-50 py-4 px-8 border-t border-gray-100 text-center space-y-1">
          <p className="text-sm text-gray-600">
            Belum mendaftar?{" "}
            <Link
              to="/daftar"
              className="font-medium text-amber-600 hover:text-amber-500"
            >
              Daftar di sini
            </Link>
          </p>
          <p className="text-xs text-gray-500">
            Warga Belajar / Pengajar / Admin?{" "}
            <Link to="/login" className="font-medium text-gray-700 underline">
              Login portal utama
            </Link>
          </p>
        </div>
      </div>

      {resetOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">
              Buat / Reset Password
            </h2>
            {resetSent ? (
              <>
                <p className="text-sm text-gray-600">
                  Jika{" "}
                  <span className="font-semibold">{resetEmail}</span> terdaftar
                  sebagai calon pendaftar, tautan pembuatan password sudah
                  dikirim ke email tersebut. Cek juga folder spam.
                </p>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setResetOpen(false)}
                    className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700"
                  >
                    Tutup
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    required
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="email saat mendaftar"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setResetOpen(false)}
                    className="px-4 py-2 text-sm text-gray-600 font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700"
                  >
                    Kirim Tautan
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalonLoginPage;
