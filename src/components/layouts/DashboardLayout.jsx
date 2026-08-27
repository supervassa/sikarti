import React, { useState } from "react";
import { Link, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import LogoPKBM from "../../assets/logo.png";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const isSuperadmin = currentUser?.role === "superadmin";
  const dashboardPath = isSuperadmin
    ? "/superadmin/dashboard"
    : "/admin/dashboard";

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Gagal keluar:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f4f8] text-slate-800 flex font-sans">
      {/* SIDEBAR MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
        ></div>
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-200 bg-white text-slate-700 transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col shadow-xl md:shadow-none`}
      >
        {/* Logo / Header Sidebar */}
        <div className="flex h-20 items-center border-b border-slate-100 px-7">
          <div className="mr-3 grid h-11 w-11 place-items-center rounded-xl bg-white p-1 shadow-md shadow-violet-100 ring-1 ring-slate-100">
            <img
              src={LogoPKBM}
              alt="Logo PKBM Kartini"
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <span className="block text-base font-extrabold tracking-tight text-slate-900">
              PKBM Kartini
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-violet-600">
              Admin workspace
            </span>
          </div>
        </div>

        {/* Menu Navigasi */}
        <nav className="flex-1 px-5 py-7 space-y-1.5 overflow-y-auto text-sm">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Menu utama
          </p>
          <Link
            to={dashboardPath}
            className="flex items-center gap-3 rounded-xl bg-violet-50 px-3 py-3 font-semibold text-violet-700 transition-colors"
          >
            <span>▦</span> Dashboard
          </Link>
          <Link
            to="/admin/wb"
            className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-slate-100 transition-colors"
          >
            <span>◉</span> Warga Belajar
          </Link>
          <Link
            to="/admin/pengajar"
            className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-slate-100 transition-colors"
          >
            <span>♙</span> Pengajar
          </Link>
          <Link
            to="/admin/jadwal"
            className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-slate-100 transition-colors"
          >
            <span>□</span> Jadwal
          </Link>
          <Link
            to="/admin/pendaftaran"
            className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-slate-100 transition-colors"
          >
            <span>◌</span> Pendaftaran
          </Link>
          <Link
            to="/admin/berita"
            className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-slate-100 transition-colors"
          >
            <span>▤</span> Berita & Kegiatan
          </Link>
          {isSuperadmin && (
            <>
              <p className="mb-3 mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Superadmin
              </p>
              <Link
                to="/superadmin/admins"
                className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-slate-100 transition-colors"
              >
                <span>♟</span> Manajemen Admin
              </Link>
              <Link
                to="/superadmin/audit-log"
                className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-slate-100 transition-colors"
              >
                <span>◷</span> Audit Log
              </Link>
            </>
          )}
          <p className="mb-3 mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Pengaturan
          </p>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-slate-100 transition-colors"
          >
            <span>⚙</span> Pengaturan
          </button>
        </nav>

        {/* Info Pengguna & Keluar di Bawah Sidebar */}
        <div className="m-4 rounded-2xl bg-slate-50 p-3">
          <div className="flex items-center mb-3">
            <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center font-bold text-white uppercase">
              {currentUser?.nama ? currentUser.nama.charAt(0) : "A"}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-semibold text-slate-800 truncate">
                {currentUser?.nama || "Administrator"}
              </p>
              <p className="text-xs text-violet-600 capitalize">
                {currentUser?.role || "Admin"}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2 px-4 border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-700 text-slate-600 rounded-xl text-xs font-bold transition-colors"
          >
            Keluar Sistem
          </button>
        </div>
      </aside>

      {/* KONTEN UTAMA */}
      <div className="flex-1 flex flex-col md:pl-72">
        {/* HEADER ATAS */}
        <header className="h-20 bg-white/90 backdrop-blur border-b border-slate-200 flex items-center justify-between px-5 sm:px-8 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-500 hover:text-gray-700 md:hidden focus:outline-none"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <div className="hidden md:block">
            <p className="text-sm text-slate-500">Selamat datang,</p>
            <p className="font-bold text-slate-900">
              {currentUser?.nama || "Administrator"}
            </p>
          </div>

          <div className="flex flex-1 justify-end sm:mx-10">
            <label className="hidden w-full max-w-md items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-400 sm:flex">
              <span>⌕</span>
              <input
                className="w-full bg-transparent outline-none placeholder:text-slate-400"
                placeholder="Cari warga belajar, jadwal, atau berita"
              />
            </label>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 sm:block capitalize">
              {currentUser?.role || "Admin"}
            </span>
            <button
              type="button"
              aria-label="Notifikasi"
              className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600"
            >
              ♧
            </button>
          </div>
        </header>

        {/* AREA HALAMAN DINAMIS */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
