import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { updateOwnContact } from "../../services/wbServices";

const ProfilWB = () => {
  const { currentUser } = useAuth();
  const [noHp, setNoHp] = useState(currentUser?.noHp || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await updateOwnContact(currentUser.uid, noHp, currentUser);
      setMessage("Nomor HP berhasil diperbarui.");
    } catch (err) {
      setMessage("Gagal memperbarui: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Profil Saya
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Data diri Anda di PKBM KARTINI.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-400">Nama Lengkap</p>
            <p className="font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
              {currentUser?.nama}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Nomor Induk</p>
            <p className="font-semibold text-slate-800 dark:text-slate-100 mt-0.5 font-mono">
              {currentUser?.nomorInduk || "-"}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Program Paket</p>
            <p className="font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
              {currentUser?.paket || "-"}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">NIK</p>
            <p className="font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
              {currentUser?.nik || "-"}
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSave}
          className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Nomor HP
            </label>
            <input
              type="tel"
              value={noHp}
              onChange={(e) => setNoHp(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500 bg-transparent"
            />
          </div>
          <div className="flex items-center justify-between">
            {message && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {message}
              </p>
            )}
            <button
              type="submit"
              disabled={saving}
              className="ml-auto px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-60"
            >
              {saving ? "Menyimpan…" : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <p className="font-semibold text-slate-800 dark:text-slate-100">
          Ganti Password
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Untuk mengganti atau mengatur ulang password, hubungi admin PKBM
          KARTINI. Admin dapat membuatkan password baru untuk Anda.
        </p>
      </div>
    </section>
  );
};

export default ProfilWB;
