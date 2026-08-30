import { Outlet, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import { useAuth } from "../context/AuthContext";
import LogoPKBM from "../assets/logo.png";
import ThemeToggle from "../components/common/ThemeToggle";

// Portal ringkas untuk calon Warga Belajar: hanya pembayaran pendaftaran & lengkapi profil.
const CalonWBLayout = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/pendaftaran/login", { replace: true });
  };

  const displayName = currentUser?.nama || "Calon Warga Belajar";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-800 dark:text-slate-100 transition-colors">
      <header className="h-16 md:h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 flex items-center justify-between gap-4 sticky top-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={LogoPKBM}
            alt="Logo PKBM KARTINI"
            className="w-10 h-10 shrink-0 rounded-2xl object-contain bg-white ring-1 ring-slate-100 dark:ring-slate-700"
          />
          <div className="min-w-0">
            <p className="text-xs text-slate-400 truncate">
              Portal Pendaftaran
            </p>
            <p className="text-sm md:text-base font-bold text-slate-900 dark:text-white truncate">
              {displayName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <ThemeToggle />
          <span className="hidden sm:inline-block text-xs font-bold uppercase px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
            Calon WB
          </span>
          <button
            onClick={handleLogout}
            title="Keluar Sesi"
            className="p-2 rounded-lg text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all"
          >
            <FontAwesomeIcon icon={faRightFromBracket} className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default CalonWBLayout;
