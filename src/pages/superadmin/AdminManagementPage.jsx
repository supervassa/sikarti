import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
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

const AdminManagementPage = () => {
  const { currentUser } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    nama: "",
    username: "",
    email: "",
    password: "",
  });
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
      setForm({ nama: "", username: "", email: "", password: "" });
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
    if (!window.confirm(`Kirim email reset password ke ${admin.email}?`))
      return;
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
    <section className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-sm font-semibold text-violet-600">SUPERADMIN</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">
          Manajemen Admin
        </h1>
        <p className="mt-2 text-slate-500">
          Buat akun admin, pantau login terakhir, dan kelola status akses.
        </p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[.9fr_1.7fr]">
        <form
          onSubmit={handleCreate}
          autoComplete="off"
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-bold">Tambah Admin</h2>
          <p className="mt-1 text-sm text-slate-500">
            Admin baru menerima akses role Admin saja.
          </p>
          <div className="mt-5 space-y-3">
            {[
              ["nama", "Nama lengkap", "text", "off"],
              ["username", "Username", "text", "off"],
              ["email", "Email", "email", "off"],
              ["password", "Password sementara", "password", "new-password"],
            ].map(([key, label, type, ac]) => (
              <label
                key={key}
                className="block text-sm font-medium text-slate-700"
              >
                {label}
                <input
                  required
                  minLength={key === "password" ? 6 : 2}
                  type={type}
                  name={`new-admin-${key}`}
                  autoComplete={ac}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-violet-500"
                />
              </label>
            ))}
          </div>
          <button
            disabled={saving}
            className="mt-5 w-full rounded-xl bg-violet-600 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? "Memproses…" : "Buat akun admin"}
          </button>
          {message && <p className="mt-3 text-sm text-slate-600">{message}</p>}
        </form>
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <h2 className="font-bold">Admin terdaftar</h2>
            <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
              {admins.length} admin
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3">Admin</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Last login</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-8 text-center text-slate-500"
                    >
                      Memuat data admin…
                    </td>
                  </tr>
                ) : (
                  admins.map((admin) => (
                    <tr key={admin.id} className="border-t border-slate-100">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800">
                          {admin.nama}
                        </p>
                        <p className="text-xs text-slate-500">{admin.email}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                            admin.role === "superadmin"
                              ? "bg-violet-600 text-white"
                              : "bg-violet-50 text-violet-700"
                          }`}
                        >
                          {admin.role === "superadmin" ? "Superadmin" : "Admin"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500">
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
                        <div className="flex gap-2">
                          <button
                            disabled={saving}
                            onClick={() => toggleStatus(admin)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold hover:bg-slate-50 disabled:opacity-60"
                          >
                            {admin.status ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                          <button
                            disabled={saving}
                            onClick={() => resetPassword(admin)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold hover:bg-slate-50 disabled:opacity-60"
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
                            className="rounded-lg border border-violet-200 px-3 py-1.5 text-xs font-bold text-violet-700 hover:bg-violet-50 disabled:opacity-40"
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
      </div>
    </section>
  );
};

export default AdminManagementPage;
