import React, { useEffect, useRef, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import { useWBPhoto } from "../../hooks/useWBPhoto";
import DateField from "../../components/common/DateField";
import SelectField from "../../components/common/SelectField";
import {
  updateOwnWBProfile,
  setOwnWBPhoto,
  deleteOwnWBPhoto,
} from "../../services/wbServices";
import { readFileField } from "../../services/registrationServices";

const todayISO = new Date().toISOString().slice(0, 10);

const JENIS_KELAMIN_OPTIONS = ["Laki-laki", "Perempuan"];
const AGAMA_OPTIONS = [
  "Islam",
  "Kristen",
  "Katolik",
  "Hindu",
  "Buddha",
  "Konghucu",
  "Lainnya",
];

const EMPTY_FORM = {
  nama: "",
  emailKontak: "",
  paket: "Paket C",
  tahunAngkatan: "",
  nik: "",
  noHp: "",
  nisn: "",
  jenisKelamin: "",
  agama: "",
  tempatLahir: "",
  tanggalLahir: "",
  alamat: "",
  sekolahAsal: "",
  namaAyah: "",
  namaIbu: "",
  tingkat: "",
};

const Card = ({ title, children }) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
    {title && (
      <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
        {title}
      </h2>
    )}
    {children}
  </div>
);

const inputCls =
  "w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500 bg-transparent";
const lockedInputCls =
  "w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed";
const labelCls =
  "block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1";
const lockedNote = (
  <span className="ml-1 text-[10px] font-normal text-slate-400">
    (diatur admin)
  </span>
);

const ProfilWB = () => {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid;
  const photo = useWBPhoto(uid);

  const [wb, setWb] = useState(currentUser || null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const seeded = useRef(false);

  useEffect(() => {
    if (!uid) return undefined;
    const unsub = onSnapshot(doc(db, "users", uid), (snap) => {
      if (!snap.exists()) return;
      const data = { id: snap.id, ...snap.data() };
      setWb(data);
      if (!seeded.current) {
        seeded.current = true;
        setForm({
          ...EMPTY_FORM,
          nama: data.nama || "",
          emailKontak: data.emailKontak || "",
          paket: data.paket || "Paket C",
          tahunAngkatan: data.tahunAngkatan || "",
          nik: data.nik || "",
          noHp: data.noHp || "",
          nisn:
            data.nisn && data.nisn !== "NISN belum ada" ? data.nisn : "",
          jenisKelamin: data.jenisKelamin || "",
          agama: data.agama || "",
          tempatLahir: data.tempatLahir || "",
          tanggalLahir: data.tanggalLahir || "",
          alamat: data.alamat || "",
          sekolahAsal: data.sekolahAsal || "",
          namaAyah: data.namaAyah || "",
          namaIbu: data.namaIbu || "",
          tingkat: data.tingkat || "",
        });
      }
    });
    return unsub;
  }, [uid]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await updateOwnWBProfile(uid, form, currentUser);
      setMessage("Profil berhasil diperbarui.");
    } catch (err) {
      setMessage("Gagal memperbarui: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoBusy(true);
    setMessage("");
    try {
      const read = await readFileField(file);
      await setOwnWBPhoto(uid, read.base64, currentUser);
      setMessage("Foto berhasil diperbarui.");
    } catch (err) {
      setMessage("Gagal mengunggah foto: " + err.message);
    } finally {
      setPhotoBusy(false);
    }
  };

  const handlePhotoDelete = async () => {
    if (!confirm("Hapus foto profil Anda?")) return;
    setPhotoBusy(true);
    try {
      await deleteOwnWBPhoto(uid, currentUser);
    } catch (err) {
      setMessage("Gagal menghapus foto: " + err.message);
    } finally {
      setPhotoBusy(false);
    }
  };

  return (
    <section className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Profil Saya
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Perbarui data diri dan foto Anda di PKBM KARTINI.
        </p>
      </div>

      <Card title="Foto">
        <div className="flex items-center gap-4">
          <div className="w-24 h-32 shrink-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
            {photo ? (
              <img
                src={photo}
                alt={wb?.nama || "Foto"}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[11px] text-slate-400 text-center px-2">
                Belum ada foto
              </span>
            )}
          </div>
          <div className="space-y-2">
            <label className="inline-block px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
              {photoBusy ? "Memproses…" : photo ? "Ganti Foto" : "Unggah Foto"}
              <input
                type="file"
                accept="image/*"
                disabled={photoBusy}
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
            {photo && (
              <button
                type="button"
                disabled={photoBusy}
                onClick={handlePhotoDelete}
                className="block px-3 py-2 text-sm font-semibold text-rose-700 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400 rounded-lg hover:bg-rose-100 disabled:opacity-60"
              >
                Hapus Foto
              </button>
            )}
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              JPG/PNG, maks ± 650 KB. Kompres dulu bila terlalu besar.
            </p>
          </div>
        </div>
      </Card>

      <Card title="Identitas Login">
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">
            Nomor Induk (login)
          </p>
          <p className="font-mono text-lg font-bold text-slate-800 dark:text-slate-100">
            {wb?.nomorInduk || currentUser?.email || "-"}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Status keanggotaan &amp; Nomor Induk hanya dapat diubah oleh admin.
          </p>
        </div>
      </Card>

      <Card title="Data Diri">
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className={labelCls}>Nama Lengkap</label>
            <input
              required
              type="text"
              value={form.nama}
              onChange={set("nama")}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Email Kontak (opsional)</label>
            <input
              type="email"
              value={form.emailKontak}
              onChange={set("emailKontak")}
              placeholder="Untuk pemberitahuan, bukan untuk login"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Program Paket {lockedNote}</label>
              <input
                type="text"
                value={form.paket || "-"}
                disabled
                readOnly
                className={lockedInputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Tahun Angkatan {lockedNote}</label>
              <input
                type="text"
                value={form.tahunAngkatan || "-"}
                disabled
                readOnly
                className={lockedInputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>NIK (16 digit) {lockedNote}</label>
              <input
                type="text"
                value={form.nik || "-"}
                disabled
                readOnly
                className={`${lockedInputCls} font-mono`}
              />
            </div>
            <div>
              <label className={labelCls}>Nomor HP</label>
              <input
                type="tel"
                value={form.noHp}
                onChange={set("noHp")}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>NISN {lockedNote}</label>
              <input
                type="text"
                value={form.nisn || "NISN belum ada"}
                disabled
                readOnly
                className={lockedInputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Jenis Kelamin</label>
              <SelectField
                value={form.jenisKelamin}
                onChange={(val) =>
                  setForm((f) => ({ ...f, jenisKelamin: val }))
                }
                placeholder="—"
                options={JENIS_KELAMIN_OPTIONS}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Agama</label>
              <SelectField
                value={form.agama}
                onChange={(val) => setForm((f) => ({ ...f, agama: val }))}
                placeholder="—"
                options={AGAMA_OPTIONS}
              />
            </div>
            <div>
              <label className={labelCls}>Tingkat / Kelas {lockedNote}</label>
              <input
                type="text"
                value={form.tingkat || "-"}
                disabled
                readOnly
                className={lockedInputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Tempat Lahir</label>
              <input
                type="text"
                value={form.tempatLahir}
                onChange={set("tempatLahir")}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Tanggal Lahir</label>
              <DateField
                value={form.tanggalLahir}
                onChange={(iso) => setForm((f) => ({ ...f, tanggalLahir: iso }))}
                max={todayISO}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Alamat</label>
            <textarea
              rows={2}
              value={form.alamat}
              onChange={set("alamat")}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Sekolah Asal</label>
            <input
              type="text"
              value={form.sekolahAsal}
              onChange={set("sekolahAsal")}
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Nama Ayah</label>
              <input
                type="text"
                value={form.namaAyah}
                onChange={set("namaAyah")}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Nama Ibu</label>
              <input
                type="text"
                value={form.namaIbu}
                onChange={set("namaIbu")}
                className={inputCls}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
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
      </Card>

      <Card title="Ganti Password">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Untuk mengganti atau mengatur ulang password, hubungi admin PKBM
          KARTINI. Admin dapat membuatkan password baru untuk Anda.
        </p>
      </Card>
    </section>
  );
};

export default ProfilWB;
