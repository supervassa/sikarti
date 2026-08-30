import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { completeCalonProfile } from "../../services/registrationServices";
import DateField from "../../components/common/DateField";
import SelectField from "../../components/common/SelectField";

const PAKET_OPTIONS = ["Paket A", "Paket B", "Paket C"];
const TODAY_ISO = new Date().toISOString().slice(0, 10);

const field =
  "w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-red-500 bg-transparent";
const labelCls =
  "block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1";

const CalonWBProfilPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const uid = currentUser?.uid;

  const [reg, setReg] = useState(currentUser?.registration || null);
  const [regSynced, setRegSynced] = useState(false);
  const [form, setForm] = useState(null);
  const [pasFoto, setPasFoto] = useState(null);
  const [dokumenPendukung, setDokumenPendukung] = useState(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  // { ok: boolean, msg: string } — ditampilkan sebagai modal pop-up hasil simpan.
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!uid) return undefined;
    return onSnapshot(doc(db, "registrations", uid), (snap) => {
      setReg(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      setRegSynced(true);
    });
  }, [uid]);

  // Prefill sekali dari data pendaftaran (adjust-state-on-prop-change saat render).
  if (reg && form === null) {
    setForm({
      namaLengkap: reg.namaLengkap || "",
      nik: reg.nik || "",
      nisn: reg.nisn || "",
      tempatLahir: reg.tempatLahir || "",
      tanggalLahir: reg.tanggalLahir || "",
      jenisKelamin: reg.jenisKelamin || "",
      alamat: reg.alamat || "",
      noHp: reg.noHp || "",
      namaWali: reg.namaWali || "",
      noHpWali: reg.noHpWali || "",
      program: reg.program || "",
    });
  }

  // Guard hanya setelah data realtime tiba, supaya snapshot lama saat login
  // (mis. masih MENUNGGU_PEMBAYARAN) tidak salah memantulkan balik ke halaman tagihan.
  if (
    regSynced &&
    (!reg || (reg.status !== "LUNAS" && reg.status !== "DIAKTIFKAN"))
  ) {
    return <Navigate to="/pendaftaran/tagihan" replace />;
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await completeCalonProfile(uid, {
        ...form,
        pasFoto,
        dokumenPendukung,
        existingDokumen: reg?.dokumen,
      });
      setDone(true);
      setPasFoto(null);
      setDokumenPendukung(null);
      setResult({
        ok: true,
        msg: "Data Anda berhasil disimpan. Menunggu aktivasi dari admin PKBM KARTINI. Anda akan menerima email saat akun diaktifkan.",
      });
    } catch (err) {
      console.error("completeCalonProfile gagal:", err);
      setResult({
        ok: false,
        msg: `${err.message || "Data gagal disimpan. Silakan coba lagi."}${err.code ? ` (${err.code})` : ""}`,
      });
    } finally {
      setSaving(false);
    }
  };

  if (!form) {
    return <p className="text-sm text-slate-500">Memuat formulir…</p>;
  }

  const alreadySubmitted = done || !!reg?.profileCompletedAt;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Lengkapi Data Diri
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Lengkapi data berikut agar admin dapat mengaktifkan akun Warga Belajar
          Anda.
        </p>
      </div>

      {alreadySubmitted && (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 p-6">
          <h2 className="text-lg font-bold text-emerald-800 dark:text-emerald-300">
            Data terkirim
          </h2>
          <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
            Data Anda sedang ditinjau admin. Anda akan menerima email saat akun
            diaktifkan, lalu bisa login kembali untuk masuk ke portal Warga
            Belajar. Anda masih dapat memperbarui data di bawah ini bila perlu.
          </p>
          <button
            onClick={() => navigate("/pendaftaran/tagihan")}
            className="mt-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300 underline"
          >
            Kembali ke halaman status
          </button>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6"
      >
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">
            1. Data Diri
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>Nama Lengkap</label>
              <input
                required
                type="text"
                value={form.namaLengkap}
                onChange={set("namaLengkap")}
                className={field}
              />
            </div>
            <div>
              <label className={labelCls}>NIK</label>
              <input
                required
                type="text"
                value={form.nik}
                onChange={set("nik")}
                className={field}
              />
            </div>
            <div>
              <label className={labelCls}>NISN (opsional)</label>
              <input
                type="text"
                value={form.nisn}
                onChange={set("nisn")}
                className={field}
              />
            </div>
            <div>
              <label className={labelCls}>Tempat Lahir</label>
              <input
                required
                type="text"
                value={form.tempatLahir}
                onChange={set("tempatLahir")}
                className={field}
              />
            </div>
            <div>
              <label className={labelCls}>Tanggal Lahir</label>
              <DateField
                required
                value={form.tanggalLahir}
                onChange={(iso) =>
                  setForm((f) => ({ ...f, tanggalLahir: iso }))
                }
                max={TODAY_ISO}
              />
            </div>
            <div>
              <label className={labelCls}>Jenis Kelamin</label>
              <SelectField
                required
                value={form.jenisKelamin}
                onChange={(val) =>
                  setForm((f) => ({ ...f, jenisKelamin: val }))
                }
                placeholder="Pilih…"
                options={[
                  { value: "L", label: "Laki-laki" },
                  { value: "P", label: "Perempuan" },
                ]}
              />
            </div>
            <div>
              <label className={labelCls}>Nomor HP / WhatsApp</label>
              <input
                required
                type="tel"
                value={form.noHp}
                onChange={set("noHp")}
                className={field}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Alamat Lengkap</label>
              <textarea
                required
                rows="3"
                value={form.alamat}
                onChange={set("alamat")}
                className={field}
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">
            2. Data Orang Tua / Wali
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Nama Orang Tua / Wali</label>
              <input
                required
                type="text"
                value={form.namaWali}
                onChange={set("namaWali")}
                className={field}
              />
            </div>
            <div>
              <label className={labelCls}>Nomor HP Orang Tua / Wali</label>
              <input
                required
                type="tel"
                value={form.noHpWali}
                onChange={set("noHpWali")}
                className={field}
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">
            3. Program Pendidikan
          </h3>
          <div className="max-w-xs">
            <label className={labelCls}>Pilihan Program</label>
            <SelectField
              required
              value={form.program}
              onChange={(val) => setForm((f) => ({ ...f, program: val }))}
              placeholder="Pilih Program…"
              options={PAKET_OPTIONS}
            />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">
            4. Unggah Dokumen
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Format .JPG / .PNG, ukuran maksimal ± 650 KB per file.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                Pas Foto (3x4 / 4x6)
                {reg?.dokumen?.pasFoto ? " — sudah ada" : ""}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPasFoto(e.target.files?.[0] || null)}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
              />
            </div>
            <div>
              <label className={labelCls}>
                Dokumen Pendukung (KK / Ijazah)
                {reg?.dokumen?.dokumenPendukung ? " — sudah ada" : ""}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setDokumenPendukung(e.target.files?.[0] || null)
                }
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
              />
            </div>
          </div>
          {!reg?.dokumen && (
            <p className="mt-2 text-xs text-amber-600">
              Kedua dokumen wajib diunggah pada pengiriman pertama.
            </p>
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 text-sm bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-60"
          >
            {saving
              ? "Menyimpan…"
              : alreadySubmitted
                ? "Perbarui Data"
                : "Kirim Data"}
          </button>
        </div>
      </form>

      {result && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 text-center shadow-xl">
            <div
              className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold ${
                result.ok
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-rose-50 text-rose-600"
              }`}
            >
              {result.ok ? "✓" : "!"}
            </div>
            <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
              {result.ok ? "Berhasil" : "Gagal"}
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {result.msg}
            </p>
            <button
              onClick={() => {
                setResult(null);
                if (result.ok) navigate("/pendaftaran/tagihan");
              }}
              className={`mt-5 w-full px-4 py-2 text-sm font-semibold text-white rounded-lg ${
                result.ok
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-slate-800 hover:bg-slate-900"
              }`}
            >
              {result.ok ? "Selesai" : "Tutup"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default CalonWBProfilPage;
