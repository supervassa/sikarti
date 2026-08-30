import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import LogoPKBM from "../../assets/logo.png";
import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "../common/ThemeToggle";

const NAV_LINKS = [
  { to: "/", label: "Beranda" },
  { to: "/profil", label: "Profil" },
  { to: "/berita", label: "Berita" },
  { to: "/kontak", label: "Kontak" },
];

const DASHBOARD_PATH_BY_ROLE = {
  superadmin: "/superadmin/dashboard",
  admin: "/admin/dashboard",
  pengajar: "/pengajar/dashboard",
  wb: "/wb/dashboard",
  calon_wb: "/pendaftaran",
};

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) =>
    path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(path);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate("/");
  };

  const dashboardPath = currentUser
    ? DASHBOARD_PATH_BY_ROLE[currentUser.role] || "/"
    : null;

  return (
    <header className="bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-50 transition-colors">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center gap-3">
        <Link to="/" className="flex items-center space-x-2 min-w-0">
          <img
            src={LogoPKBM}
            alt="Logo PKBM KARTINI"
            className="w-10 h-10 shrink-0 object-contain"
          />
          <span className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white truncate">
            PKBM KARTINI
          </span>
        </Link>

        {/* Navigasi tautan — desktop */}
        <nav className="hidden md:flex space-x-6 text-sm font-medium">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={
                isActive(link.to)
                  ? "text-red-600 dark:text-red-400 font-semibold"
                  : "text-gray-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400"
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Aksi kanan — desktop */}
        <div className="hidden md:flex items-center space-x-3">
          <ThemeToggle />
          {currentUser ? (
            <>
              <span className="hidden lg:inline text-sm text-gray-600 dark:text-slate-300 font-medium">
                Halo,{" "}
                {currentUser.nama || currentUser.displayName || "Pengguna"}
              </span>
              <Link
                to={dashboardPath}
                className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 rounded hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded hover:bg-red-700"
              >
                Keluar
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-slate-600 dark:text-slate-200 rounded hover:bg-gray-100 dark:hover:bg-slate-800"
              >
                Masuk
              </Link>
              <Link
                to="/daftar"
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded hover:bg-red-700"
              >
                Daftar
              </Link>
            </>
          )}
        </div>

        {/* Tombol hamburger — mobile */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
          aria-expanded={menuOpen}
          className="md:hidden shrink-0 grid h-10 w-10 place-items-center rounded-lg border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            {menuOpen ? (
              <>
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="6" y1="18" x2="18" y2="6" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Panel menu — mobile */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <nav className="container mx-auto px-4 py-3 flex flex-col">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`py-2.5 text-sm font-medium ${
                  isActive(link.to)
                    ? "text-red-600 dark:text-red-400 font-semibold"
                    : "text-gray-700 dark:text-slate-300"
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div className="my-2 border-t border-gray-100 dark:border-slate-800" />

            <div className="flex items-center justify-between py-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Tema
              </span>
              <ThemeToggle />
            </div>

            <div className="mt-3 flex flex-col gap-2">
              {currentUser ? (
                <>
                  <span className="text-sm text-gray-500 dark:text-slate-400">
                    Halo,{" "}
                    {currentUser.nama || currentUser.displayName || "Pengguna"}
                  </span>
                  <Link
                    to={dashboardPath}
                    onClick={() => setMenuOpen(false)}
                    className="w-full text-center px-4 py-2.5 text-sm font-semibold border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Keluar
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="w-full text-center px-4 py-2.5 text-sm font-semibold border border-gray-300 dark:border-slate-600 dark:text-slate-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
                  >
                    Masuk
                  </Link>
                  <Link
                    to="/daftar"
                    onClick={() => setMenuOpen(false)}
                    className="w-full text-center px-4 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Daftar
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
