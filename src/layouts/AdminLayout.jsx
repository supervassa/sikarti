import React, { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartPie,
  faGraduationCap,
  faChalkboardUser,
  faBookOpen,
  faCalendarDays,
  faClipboardList,
  faNewspaper,
  faCalendarCheck,
  faCreditCard,
  faShieldHalved,
  faUsersGear,
  faChevronLeft,
  faChevronRight,
  faBars,
  faXmark,
  faMagnifyingGlass,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../context/AuthContext";
import LogoPKBM from "../assets/logo.png";
import ThemeToggle from "../components/common/ThemeToggle";

const AdminLayout = () => {
  const { currentUser, logout, role } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Menu Operasional Admin (Dapat diakses oleh Admin & Superadmin)
  const adminNavItems = [
    { path: "/admin/dashboard", label: "Dashboard Overview", icon: faChartPie },
    { path: "/admin/wb", label: "Data Warga Belajar", icon: faGraduationCap },
    { path: "/admin/pengajar", label: "Data Pengajar", icon: faChalkboardUser },
    { path: "/admin/mapel", label: "Mata Pelajaran", icon: faBookOpen },
    { path: "/admin/jadwal", label: "Jadwal Pelajaran", icon: faCalendarDays },
    {
      path: "/admin/pendaftar",
      label: "Pendaftar Calon WB",
      icon: faClipboardList,
    },
    { path: "/admin/konten", label: "Berita & Pengumuman", icon: faNewspaper },
    {
      path: "/admin/presensi",
      label: "Rekap Kehadiran",
      icon: faCalendarCheck,
    },
    { path: "/admin/keuangan", label: "Informasi Tagihan", icon: faCreditCard },
  ];

  // Menu Khusus Superadmin (Hanya muncul untuk Superadmin)
  const superadminNavItems = [
    {
      path: "/superadmin/dashboard",
      label: "Superadmin Dashboard",
      icon: faShieldHalved,
    },
    { path: "/superadmin/admins", label: "Manajemen Admin", icon: faUsersGear },
  ];

  const isActive = (path) => location.pathname === path;
  const displayName =
    currentUser?.nama || currentUser?.displayName || "Pengguna";
  const initials = displayName.trim().charAt(0).toUpperCase() || "A";

  const renderNavItem = (item, accent) => (
    <Link
      key={item.path}
      to={item.path}
      onClick={() => setSidebarOpen(false)}
      title={collapsed ? item.label : undefined}
      className={`flex items-center ${collapsed ? "justify-center" : "space-x-3"} px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
        isActive(item.path)
          ? accent === "violet"
            ? "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 font-semibold"
            : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-semibold"
          : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100"
      }`}
    >
      <FontAwesomeIcon icon={item.icon} className="w-4 h-4 shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans text-slate-800 dark:text-slate-100 transition-colors">
      {/* Overlay Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 ${collapsed ? "md:w-20" : "md:w-64"} bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-all duration-200 ease-in-out flex flex-col justify-between ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-4 overflow-y-auto flex-1">
          {/* Header Logo */}
          <div
            className={`flex items-center mb-8 pb-4 border-b border-slate-100 dark:border-slate-800 ${collapsed ? "justify-center" : "justify-between"}`}
          >
            <div
              className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}
            >
              <img
                src={LogoPKBM}
                alt="Logo PKBM KARTINI"
                className="w-10 h-10 shrink-0 rounded-2xl object-contain bg-white ring-1 ring-slate-100 dark:ring-slate-700"
              />
              {!collapsed && (
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white leading-tight">
                    PKBM KARTINI
                  </h2>
                  <p className="text-xs text-slate-400 capitalize">
                    Portal {role}
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex w-7 h-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <FontAwesomeIcon
                icon={collapsed ? faChevronRight : faChevronLeft}
                className="w-3 h-3"
              />
            </button>
          </div>

          {/* Menu Khusus Superadmin (Jika Role = Superadmin) */}
          {role === "superadmin" && (
            <div className="mb-6">
              {!collapsed && (
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-3">
                  Area Superadmin
                </p>
              )}
              <nav className="space-y-1">
                {superadminNavItems.map((item) =>
                  renderNavItem(item, "violet"),
                )}
              </nav>
            </div>
          )}

          {/* Menu Operasional Admin (Superadmin & Admin) */}
          <div>
            {!collapsed && (
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-3">
                Manajemen Operasional
              </p>
            )}
            <nav className="space-y-1">
              {adminNavItems.map((item) => renderNavItem(item, "red"))}
            </nav>
          </div>
        </div>

        {/* Footer User Info & Logout */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div
            className={`flex items-center gap-2 ${collapsed ? "justify-center" : "justify-between"}`}
          >
            {!collapsed && (
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-9 h-9 shrink-0 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold flex items-center justify-center text-sm">
                  {initials}
                </div>
                <div className="truncate">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {currentUser?.email}
                  </p>
                </div>
              </div>
            )}
            <button
              onClick={logout}
              title="Keluar Sesi"
              className="p-2 rounded-lg text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all shrink-0"
            >
              <FontAwesomeIcon icon={faRightFromBracket} className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Kolom Konten Utama */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 md:h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 flex items-center justify-between gap-4 sticky top-0 z-20 transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0"
            >
              <FontAwesomeIcon
                icon={sidebarOpen ? faXmark : faBars}
                className="w-4 h-4"
              />
            </button>
            <div className="min-w-0">
              <p className="text-xs text-slate-400 truncate">Selamat datang,</p>
              <p className="text-sm md:text-base font-bold text-slate-900 dark:text-white truncate">
                {displayName}
              </p>
            </div>
          </div>

          <div className="hidden md:flex flex-1 max-w-md items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2.5">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="text-slate-400 w-4 h-4"
            />
            <input
              type="text"
              placeholder="Cari sesuatu"
              className="bg-transparent outline-none text-sm text-slate-600 dark:text-slate-200 placeholder:text-slate-400 w-full"
            />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <ThemeToggle />
            <span className="hidden sm:inline-block text-xs font-bold uppercase px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400">
              {role}
            </span>
            <div className="w-9 h-9 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-sm">
              {initials}
            </div>
          </div>
        </header>

        {/* Konten Halaman */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
