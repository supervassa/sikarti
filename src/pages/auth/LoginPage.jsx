import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import LogoPKBM from "../../assets/logo.png"; // Pastikan path dan file logo benar

const LoginPage = () => {
  // State untuk form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // State untuk status UI
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // State untuk modal lupa password
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetStatus, setResetStatus] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const navigate = useNavigate();
  const {
    loginWithGoogle,
    loginWithEmail,
    currentUser,
    authError,
    clearAuthError,
  } = useAuth();

  // Efek untuk memantau jika pengguna sudah berhasil login & datanya terbaca
  useEffect(() => {
    if (currentUser) {
      const dashboardByRole = {
        superadmin: "/superadmin/dashboard",
        admin: "/admin/dashboard",
        pengajar: "/pengajar/dashboard",
        wb: "/wb/dashboard",
        calon_wb: "/pendaftaran/tagihan",
      };

      navigate(dashboardByRole[currentUser.role] ?? "/unauthorized", {
        replace: true,
      });
    }
  }, [currentUser, navigate]);

  // authError = sesi ditolak AuthContext (akun nonaktif / lulus / masa pembayaran habis).
  const shownError = errorMsg || authError;
  const busy = isLoading && !authError;

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    clearAuthError();
    try {
      await loginWithEmail(email, password);
      // Redirect otomatis diurus oleh useEffect di atas jika berhasil
    } catch {
      setErrorMsg("Email atau Password salah, atau akun tidak terdaftar.");
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg("");
    clearAuthError();
    try {
      await loginWithGoogle();
      // Redirect otomatis diurus oleh useEffect di atas jika berhasil
    } catch {
      setErrorMsg("Login Google dibatalkan atau data akun Anda tidak valid.");
      setIsLoading(false);
    }
  };

  const openResetModal = () => {
    setResetEmail(email);
    setResetStatus("");
    setIsResetOpen(true);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setResetStatus("");
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim().toLowerCase());
      setResetStatus("success");
    } catch {
      // Pesan generik dijaga sama walau email tidak terdaftar, supaya tidak bocorin data akun.
      setResetStatus("success");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="font-sans text-gray-800 bg-gray-50 min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Container Login */}
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header Form */}
        <div className="bg-[#0b1f3d] py-6 px-8 flex flex-col items-center">
          <img
            src={LogoPKBM}
            alt="Logo PKBM KARTINI"
            className="w-16 h-16 object-contain mb-3 bg-white rounded-full p-1"
          />
          <h2 className="text-2xl font-bold text-white text-center">
            Masuk ke Portal
          </h2>
          <p className="text-sm text-gray-300 mt-1 text-center">
            Gunakan akun Warga Belajar dan Pengajar.
          </p>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-6">
          {/* Tampilkan Pesan Error Jika Ada */}
          {shownError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-200">
              {shownError}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                placeholder="nama@email.com"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={openResetModal}
                  className="text-xs font-medium text-red-600 hover:text-red-500"
                >
                  Lupa password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                >
                  <FontAwesomeIcon
                    icon={showPassword ? faEyeSlash : faEye}
                    className="w-4 h-4"
                  />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className={`w-full py-2.5 px-4 bg-red-600 text-white font-bold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all ${busy ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {busy ? "Memproses..." : "Masuk"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Atau masuk dengan
              </span>
            </div>
          </div>

          {/* Tombol Google Sign-In */}
          <button
            onClick={handleGoogleLogin}
            type="button"
            disabled={busy}
            className={`w-full flex justify-center items-center py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-all ${busy ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {/* Ikon Google SVG */}
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google Sign-In
          </button>
        </div>

        {/* Footer Text */}
        <div className="bg-gray-50 py-4 px-8 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-600">
            Kembali ke{" "}
            <Link
              to="/"
              className="font-medium text-red-600 hover:text-red-500"
            >
              Beranda
            </Link>
          </p>
        </div>
      </div>

      {/* Modal Lupa Password */}
      {isResetOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">Reset Password</h2>
            {resetStatus === "success" ? (
              <>
                <p className="text-sm text-gray-600">
                  Jika <span className="font-semibold">{resetEmail}</span>{" "}
                  terdaftar, tautan reset password sudah dikirim ke email
                  tersebut. Cek juga folder spam.
                </p>
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsResetOpen(false)}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
                  >
                    Tutup
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    required
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                  />
                  <p className="mt-1.5 text-xs text-gray-500">
                    Kami akan mengirim tautan reset password ke email ini.
                  </p>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsResetOpen(false)}
                    className="px-4 py-2 text-sm text-gray-600 font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-60"
                  >
                    {resetLoading ? "Mengirim…" : "Kirim Tautan Reset"}
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

export default LoginPage;
