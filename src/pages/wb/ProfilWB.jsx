import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { updateOwnContact } from "../../services/wbServices";

const ProfilWB = () => {
  const { currentUser } = useAuth();
  const [noHp, setNoHp] = useState(currentUser?.noHp || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [resetSent, setResetSent] = useState(false);

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

  const handleResetPassword = async () => {
    try {
      await sendPasswordResetEmail(auth, currentUser.email);
    } catch {
      // pesan generik dijaga sama walau gagal, jangan bocorin status akun
    } finally {
      setResetSent(true);
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
            <p className="text-xs text-slate-400">Email</p>
            <p className="font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
              {currentUser?.email}
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

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-100">
            Ganti Password
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {resetSent
              ? "Tautan reset password sudah dikirim ke email Anda."
              : "Kami akan kirim tautan reset password ke email Anda."}
          </p>
        </div>
        <button
          onClick={handleResetPassword}
          disabled={resetSent}
          className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 shrink-0"
        >
          {resetSent ? "Terkirim" : "Kirim Email Reset"}
        </button>
      </div>
    </section>
  );
};

export default ProfilWB;
