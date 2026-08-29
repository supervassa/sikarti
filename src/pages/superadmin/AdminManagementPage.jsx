import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { db } from "../../config/firebase.js";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  createAdmin,
  resetAdminPassword,
  setAdminRole,
  setAdminStatus,
} from "../../services/adminManagement.js";

const formatDate = (value) =>
  value?.toDate
    ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(value.toDate())
    : "Belum pernah login";

const EMPTY_FORM = { nama: "", username: "", email: "", password: "" };

const FORM_FIELDS = [
  ["nama", "Nama lengkap", "text", "off"],
  ["username", "Username", "text", "off"],
  ["email", "Email", "email", "off"],
  ["password", "Password sementara", "password", "new-password"],
];

const AdminManagementPage = () => {
  const { currentUser } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "admins"), orderBy("createdAt", "desc")),
      (snapshot) => {
        setAdmins(
          snapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
        );
        setLoading(false);
      },
      () => {
        setMessage(
          "Data admin tidak dapat dimuat. Pastikan Firestore Rules sudah dideploy.",
        );
        setLoading(false);
      },
    );
    return unsubscribe;
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await createAdmin(form, currentUser);
      setForm(EMPTY_FORM);
      setModalOpen(false);
      setMessage("Akun admin berhasil dibuat.");
    } catch (error) {
      setMessage(
        error.code === "auth/email-already-in-use"
          ? "Email tersebut sudah digunakan."
          : "Akun admin belum dapat dibuat. Periksa data dan Rules Firestore.",
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (admin) => {
    setSaving(true);
    setMessage("");
    try {
      await setAdminStatus(admin, currentUser);
      setMessage(`Admin ${admin.status ? "dinonaktifkan" : "diaktifkan"}.`);
    } catch {
      setMessage("Status admin belum dapat diubah.");
    } finally {
      setSaving(false);
    }
  };

  const resetPassword = async (admin) => {
    if (!window.confirm(`Kirim email reset password ke ${admin.email}?`)) return;
    setSaving(true);
    setMessage("");
    try {
      await resetAdminPassword(admin, currentUser);
      setMessage(`Email reset password dikirim ke ${admin.email}.`);
    } catch {
      setMessage("Email reset password belum dapat dikirim.");
    } finally {
      setSaving(false);
    }
  };

  const changeRole = async (admin) => {
    const nextRole = admin.role === "superadmin" ? "admin" : "superadmin";
    const verb = nextRole === "superadmin" ? "menaikkan" : "menurunkan";
    if (
      !window.confirm(
        `Yakin ${verb} ${admin.nama} menjadi ${
          nextRole === "superadmin" ? "Superadmin" : "Admin"
        }?`,
      )
    )
      return;
    setSaving(true);
    setMessage("");
    try {
      await setAdminRole(admin, nextRole, currentUser);
      setMessage(
        `${admin.nama} kini berperan sebagai ${
          nextRole === "superadmin" ? "Superadmin" : "Admin"
        }.`,
      );
    } catch (error) {
      setMessage(error.message || "Role admin belum dapat diubah.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-violet-600 dark:text-violet-400">
            SUPERADMIN
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            Manajemen Admin
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Buat akun admin, pantau login terakhir, dan kelola status akses.
          </p>
        </div>
        <button
          onClick={() => {
            setForm(EMPTY_FORM);
            setMessage("");
            setModalOpen(true);
          }}
          className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow transition-all flex items-center justify-center gap-2"
        >
          <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
          <span>Tambah Admin</span>
        </button>
      </div>

      {message && (
        <div className="rounded-xl border border-violet-200 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-500/10 px-4 py-3 text-sm text-violet-800 dark:text-violet-200">
          {message}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-5">
          <h2 className="font-bold text-slate-900 dark:text-white">
            Admin terdaftar
          </h2>
          <span className="rounded-full bg-violet-50 dark:bg-violet-500/10 px-3 py-1 text-xs font-bold text-violet-700 dark:text-violet-300">
            {admins.length} admin
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold">
              <tr>
                <th className="px-6 py-3">Admin</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Last login</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-6 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-8 text-center text-slate-400"
                  >
                    Memuat data admin…
                  </td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-8 text-center text-slate-400"
                  >
                    Belum ada admin terdaftar.
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr
                    key={admin.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">
                        {admin.nama}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {admin.email}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                          admin.role === "superadmin"
                            ? "bg-violet-600 text-white"
                            : "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300"
                        }`}
                      >
                        {admin.role === "superadmin" ? "Superadmin" : "Admin"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(admin.lastLogin)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          admin.status
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {admin.status ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          disabled={saving}
                          onClick={() => toggleStatus(admin)}
                          className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"
                        >
                          {admin.status ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                        <button
                          disabled={saving}
                          onClick={() => resetPassword(admin)}
                          className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"
                        >
                          Reset Password
                        </button>
                        <button
                          disabled={saving || admin.id === currentUser?.uid}
                          title={
                            admin.id === currentUser?.uid
                              ? "Tidak dapat mengubah role akun sendiri"
                              : undefined
                          }
                          onClick={() => changeRole(admin)}
                          className="rounded-lg border border-violet-200 dark:border-violet-500/40 px-3 py-1.5 text-xs font-bold text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-500/10 disabled:opacity-40"
                        >
                          {admin.role === "superadmin"
                            ? "Turunkan ke Admin"
                            : "Jadikan Superadmin"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Tambah Admin
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Admin baru menerima akses role Admin saja.
              </p>
            </div>
            <form onSubmit={handleCreate} autoComplete="off" className="space-y-3">
              {FORM_FIELDS.map(([key, label, type, ac]) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    {label}
                  </label>
                  <input
                    required
                    minLength={key === "password" ? 6 : 2}
                    type={type}
                    name={`new-admin-${key}`}
                    autoComplete={ac}
                    value={form[key]}
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-violet-500 bg-transparent"
                  />
                </div>
              ))}
              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm bg-violet-600 text-white rounded-lg font-semibold hover:bg-violet-700 disabled:opacity-60"
                >
                  {saving ? "Memproses…" : "Buat akun admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default AdminManagementPage;
