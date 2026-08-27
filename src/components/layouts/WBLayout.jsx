import React, { useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { auth } from "../config/firebase";
import { signOut } from "firebase/auth";

const WBLayout = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Gagal logout:", error);
    }
  };

  const menuItems = [
    { path: "/wb/dashboard", label: "Dashboard", icon: "🏠" },
    { path: "/wb/profil", label: "Profil Saya", icon: "👤" },
    { path: "/wb/jadwal", label: "Jadwal & Presensi", icon: "📅" },
    { path: "/wb/tagihan", label: "Informasi Tagihan", icon: "💳" },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 w-64 bg-blue-900 text-white transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 transition-transform duration-200 ease-in-out z-30 flex flex-col`}
      >
        <div className="p-5 flex items-center justify-center border-b border-blue-800">
          <h2 className="text-xl font-bold text-white">Portal WB</h2>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === item.path ? "bg-blue-800 text-white" : "text-blue-100 hover:bg-blue-800"}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-blue-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors"
          >
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar */}
        <header className="bg-white shadow-sm border-b px-6 py-4 flex items-center justify-between z-10">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden text-gray-600 focus:outline-none"
          >
            <span className="text-2xl">☰</span>
          </button>
          <div className="flex items-center gap-4 ml-auto">
            <span className="text-sm font-medium text-gray-700">
              Halo, {currentUser?.nama || "Siswa"}
            </span>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-900 font-bold">
              {currentUser?.nama?.charAt(0) || "W"}
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default WBLayout;
