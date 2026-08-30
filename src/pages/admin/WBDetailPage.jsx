import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import {
  updateWB,
  normalizeWBStatus,
  setWBLifecycleStatus,
  deleteWB,
  resetUserPassword,
  getWBPassword,
  resetWBPassword,
  setWBPhoto,
  deleteWBPhoto,
} from "../../services/adminServices";
import { readFileField } from "../../services/registrationServices";
import { isDummyNomorInduk } from "../../utils/wbLogin";
import DateField from "../../components/common/DateField";
import SelectField from "../../components/common/SelectField";
import { PAKET_OPTIONS } from "../../config/opsi";

const TODAY_ISO = new Date().toISOString().slice(0, 10);

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

const DATA_DIRI_FIELDS = [
  "nisn",
  "jenisKelamin",
  "agama",
  "tempatLahir",
  "tanggalLahir",
  "alamat",
  "sekolahAsal",
  "namaAyah",
  "namaIbu",
  "tingkat",
  "nis",
];

const CURRENT_YEAR = new Date().getFullYear();
const TAHUN_ANGKATAN_OPTIONS = Array.from({ length: 5 }, (_, i) => {
  const y = CURRENT_YEAR - 3 + i;
  return `${y}/${y + 1}`;
});
const DEFAULT_TAHUN_ANGKATAN = `${CURRENT_YEAR}/${CURRENT_YEAR + 1}`;

const EMPTY_EDIT = {
  nama: "",
  emailKontak: "",
  email: "",
  paket: "Paket C",
  tahunAngkatan: DEFAULT_TAHUN_ANGKATAN,
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
  nis: "",
};

const STATUS_META = {
  AKTIF: { label: "Aktif", className: "bg-emerald-50 text-emerald-700" },
  NONAKTIF: { label: "Nonaktif", className: "bg-rose-50 text-rose-700" },
  LULUS: { label: "Lulus", className: "bg-blue-50 text-blue-700" },
};

const Card = ({ title, children }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
    {title && (
      <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
        {title}
      </h2>
    )}
    {children}
  </div>
);

const WBDetailPage = ({ wbId }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [wb, setWb] = useState(null);
  const [loading, setLoading] = useState(true);
  const seeded = useRef(false);

  const [editForm, setEditForm] = useState(EMPTY_EDIT);
  const [statusForm, setStatusForm] = useState({
    status: "AKTIF",
    tahunLulus: DEFAULT_TAHUN_ANGKATAN,
    terakhirAktif: DEFAULT_TAHUN_ANGKATAN,
  });
  const [savingDetail, setSavingDetail] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [pwdBusy, setPwdBusy] = useState(false);
  const [viewedPassword, setViewedPassword] = useState(null);
  const [newCredential, setNewCredential] = useState(null);
  const [copied, setCopied] = useState(false);

  // Foto WB (koleksi wbPhotos/{uid}, base64) — dimuat & disunting hanya di sini.
  const [photo, setPhoto] = useState(null);
  const [photoBusy, setPhotoBusy] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "users", wbId),
      (snap) => {
        if (!snap.exists() || Number(snap.data().kd_role) !== 22) {
          setWb(null);
          setLoading(false);
          return;
        }
        const data = { id: snap.id, ...snap.data() };
        setWb(data);
        if (!seeded.current) {
          seeded.current = true;
          setEditForm({
            ...EMPTY_EDIT,
            nama: data.nama || "",
            emailKontak: data.emailKontak || "",
            email: data.email || "",
            paket: data.paket || "Paket C",
            tahunAngkatan: data.tahunAngkatan || DEFAULT_TAHUN_ANGKATAN,
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
            nis: data.nis || "",
          });
          setStatusForm({
            status: normalizeWBStatus(data.status),
            tahunLulus: data.tahunLulus || DEFAULT_TAHUN_ANGKATAN,
            terakhirAktif: data.terakhirAktif || DEFAULT_TAHUN_ANGKATAN,
          });
        }
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, [wbId]);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "wbPhotos", wbId),
      (snap) => setPhoto(snap.exists() ? snap.data().base64 || null : null),
      () => setPhoto(null),
    );
    return unsub;
  }, [wbId]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoBusy(true);
    try {
      const read = await readFileField(file);
      await setWBPhoto(wb.id, read.base64, currentUser);
    } catch (err) {
      alert("Gagal mengunggah foto: " + err.message);
    } finally {
      setPhotoBusy(false);
    }
  };

  const handlePhotoDelete = async () => {
    if (!confirm("Hapus foto WB ini?")) return;
    setPhotoBusy(true);
    try {
      await deleteWBPhoto(wb.id, currentUser);
    } catch (err) {
      alert("Gagal menghapus foto: " + err.message);
    } finally {
      setPhotoBusy(false);
    }
  };

  const tahunOptions = Array.from(
    new Set(
      [
        ...TAHUN_ANGKATAN_OPTIONS,
        wb?.tahunAngkatan,
        wb?.tahunLulus,
        wb?.terakhirAktif,
      ].filter(Boolean),
    ),
  ).sort();

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSavingDetail(true);
    try {
      const payload = {
        nama: editForm.nama,
        paket: editForm.paket,
        tahunAngkatan: editForm.tahunAngkatan,
        nik: editForm.nik,
        noHp: editForm.noHp,
      };
      for (const key of DATA_DIRI_FIELDS) payload[key] = editForm[key];
      if (wb.nomorInduk) {
        payload.emailKontak = editForm.emailKontak.trim().toLowerCase();
      } else {
        payload.email = editForm.email;
      }
      await updateWB(wb.id, payload, currentUser, wb);
      alert("Data diri WB tersimpan.");
    } catch (err) {
      alert("Gagal memperbarui data WB: " + err.message);
    } finally {
      setSavingDetail(false);
    }
  };

  const handleStatusSave = async () => {
    setSavingStatus(true);
    try {
      await setWBLifecycleStatus({ id: wb.id, ...statusForm }, currentUser);
      alert("Status keanggotaan tersimpan.");
    } catch (err) {
      alert("Gagal mengubah status WB: " + err.message);
    } finally {
      setSavingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Hapus data ${wb.nama} dari sistem? Akses WB ini ke aplikasi akan langsung dicabut.`,
      )
    )
      return;
    setSavingDetail(true);
    try {
      await deleteWB(wb, currentUser);
      navigate("/admin/wb");
    } catch (err) {
      alert("Gagal menghapus data WB: " + err.message);
      setSavingDetail(false);
    }
  };

  const handleEmailReset = async () => {
    if (!confirm(`Kirim email reset password ke ${wb.email}?`)) return;
    setPwdBusy(true);
    try {
      await resetUserPassword(wb, currentUser, "MANAJEMEN_WB");
      alert("Email reset password telah dikirim ke " + wb.email);
    } catch (err) {
      alert("Gagal mengirim email reset: " + err.message);
    } finally {
      setPwdBusy(false);
    }
  };

  const handleViewPassword = async () => {
    setPwdBusy(true);
    try {
      const pwd = await getWBPassword(wb);
      setViewedPassword(pwd || "(tidak tersimpan)");
    } catch (err) {
      alert("Gagal membaca password: " + err.message);
    } finally {
      setPwdBusy(false);
    }
  };

  const handleGeneratePassword = async () => {
    if (
      !confirm(
        `Buat password baru untuk ${wb.nama}? Password lama akan langsung tidak berlaku.`,
      )
    )
      return;
    setPwdBusy(true);
    try {
      const newPwd = await resetWBPassword(wb, currentUser);
      setViewedPassword(null);
      setCopied(false);
      setNewCredential({ nomorInduk: wb.nomorInduk, password: newPwd });
    } catch (err) {
      alert("Gagal membuat password baru: " + err.message);
    } finally {
      setPwdBusy(false);
    }
  };

  const copyCredential = async () => {
    if (!newCredential) return;
    const text = `PKBM KARTINI\nNama: ${wb.nama}\nNomor Induk: ${newCredential.nomorInduk}\nPassword: ${newCredential.password}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Salin manual:\n\n" + text);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-400">Memuat data Warga Belajar…</p>;
  }

  if (!wb) {
    return (
      <div className="space-y-4">
        <Link
          to="/admin/wb"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="w-3 h-3" />
          Kembali ke Daftar
        </Link>
        <p className="text-slate-500">
          Warga Belajar tidak ditemukan (mungkin sudah dihapus).
        </p>
      </div>
    );
  }

  const statusMeta = STATUS_META[normalizeWBStatus(wb.status)];

  return (
    <section className="max-w-2xl space-y-6">
      <div>
        <Link
          to="/admin/wb"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="w-3 h-3" />
          Kembali ke Daftar
        </Link>
        <div className="mt-2 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900">{wb.nama}</h1>
          <div className="flex items-center gap-2 shrink-0">
            {isDummyNomorInduk(wb.nomorInduk) && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                DATA UJI
              </span>
            )}
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusMeta.className}`}
            >
              {statusMeta.label}
            </span>
          </div>
        </div>
        <p className="text-sm text-slate-500">Detail Warga Belajar</p>
      </div>

      <Card title="Identitas Login">
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">
            Nomor Induk (login WB)
          </p>
          {wb.nomorInduk ? (
            <p className="font-mono text-lg font-bold text-slate-800">
              {wb.nomorInduk}
            </p>
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-500">Belum ada</p>
              <p className="mt-1 text-[11px] text-amber-600">
                WB ini dibuat dengan email — login lewat tab &ldquo;Pengajar
                &amp; Staf&rdquo;. Untuk pindah ke login Nomor Induk: hapus lalu
                tambahkan ulang.
              </p>
            </>
          )}
        </div>
      </Card>

      <Card title="Data Diri">
        <form onSubmit={handleUpdate} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Nama Lengkap
            </label>
            <input
              required
              type="text"
              value={editForm.nama}
              onChange={(e) =>
                setEditForm({ ...editForm, nama: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500"
            />
          </div>
          {wb.nomorInduk ? (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Email Kontak (opsional)
              </label>
              <input
                type="email"
                value={editForm.emailKontak}
                onChange={(e) =>
                  setEditForm({ ...editForm, emailKontak: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500"
                placeholder="Untuk pemberitahuan, bukan untuk login"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Email
              </label>
              <input
                required
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm({ ...editForm, email: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500"
              />
              <p className="mt-1 text-[11px] text-amber-600">
                Ini hanya mengubah email kontak di sistem. Email login (Firebase
                Auth) tetap yang lama sampai WB reset password sendiri.
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Program Paket
              </label>
              <SelectField
                value={editForm.paket}
                onChange={(val) => setEditForm({ ...editForm, paket: val })}
                options={PAKET_OPTIONS}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Tahun Angkatan
              </label>
              <SelectField
                value={editForm.tahunAngkatan}
                onChange={(val) =>
                  setEditForm({ ...editForm, tahunAngkatan: val })
                }
                options={tahunOptions}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                NIK (16 digit)
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={16}
                value={editForm.nik}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    nik: e.target.value.replace(/\D/g, ""),
                  })
                }
                className="w-full px-3 py-2 border rounded-lg text-sm font-mono outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Nomor HP
              </label>
              <input
                type="tel"
                value={editForm.noHp}
                onChange={(e) =>
                  setEditForm({ ...editForm, noHp: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                NISN
              </label>
              <input
                type="text"
                value={editForm.nisn}
                onChange={(e) =>
                  setEditForm({ ...editForm, nisn: e.target.value })
                }
                placeholder="Kosong = 'NISN belum ada'"
                className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Jenis Kelamin
              </label>
              <SelectField
                value={editForm.jenisKelamin}
                onChange={(val) =>
                  setEditForm({ ...editForm, jenisKelamin: val })
                }
                placeholder="—"
                options={JENIS_KELAMIN_OPTIONS}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Agama
              </label>
              <SelectField
                value={editForm.agama}
                onChange={(val) => setEditForm({ ...editForm, agama: val })}
                placeholder="—"
                options={AGAMA_OPTIONS}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Tingkat / Kelas
              </label>
              <input
                type="text"
                value={editForm.tingkat}
                onChange={(e) =>
                  setEditForm({ ...editForm, tingkat: e.target.value })
                }
                placeholder="mis. 10"
                className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Tempat Lahir
              </label>
              <input
                type="text"
                value={editForm.tempatLahir}
                onChange={(e) =>
                  setEditForm({ ...editForm, tempatLahir: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Tanggal Lahir
              </label>
              <DateField
                value={editForm.tanggalLahir}
                onChange={(iso) =>
                  setEditForm({ ...editForm, tanggalLahir: iso })
                }
                max={TODAY_ISO}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Alamat
            </label>
            <textarea
              rows={2}
              value={editForm.alamat}
              onChange={(e) =>
                setEditForm({ ...editForm, alamat: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Sekolah Asal
            </label>
            <input
              type="text"
              value={editForm.sekolahAsal}
              onChange={(e) =>
                setEditForm({ ...editForm, sekolahAsal: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Nama Ayah
              </label>
              <input
                type="text"
                value={editForm.namaAyah}
                onChange={(e) =>
                  setEditForm({ ...editForm, namaAyah: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Nama Ibu
              </label>
              <input
                type="text"
                value={editForm.namaIbu}
                onChange={(e) =>
                  setEditForm({ ...editForm, namaIbu: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingDetail}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-60"
            >
              {savingDetail ? "Menyimpan…" : "Simpan Data Diri"}
            </button>
          </div>
        </form>
      </Card>

      <Card title="Foto">
        <div className="flex items-center gap-4">
          <div className="w-24 h-32 shrink-0 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
            {photo ? (
              <img
                src={photo}
                alt={`Foto ${wb.nama}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[11px] text-slate-400 text-center px-2">
                Belum ada foto
              </span>
            )}
          </div>
          <div className="space-y-2">
            <label className="inline-block px-3 py-2 text-sm font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer">
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
                className="block px-3 py-2 text-sm font-semibold text-rose-700 bg-rose-50 rounded-lg hover:bg-rose-100 disabled:opacity-60"
              >
                Hapus Foto
              </button>
            )}
            <p className="text-[11px] text-slate-500">
              JPG/PNG, maks ± 650 KB. Kompres dulu bila terlalu besar.
            </p>
          </div>
        </div>
      </Card>

      <Card title="Kelola Password">
        {wb.nomorInduk ? (
          <>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pwdBusy}
                onClick={handleViewPassword}
                className="flex-1 px-4 py-2 text-sm font-bold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-60"
              >
                Lihat Password
              </button>
              <button
                type="button"
                disabled={pwdBusy}
                onClick={handleGeneratePassword}
                className="flex-1 px-4 py-2 text-sm font-bold text-white bg-slate-800 rounded-lg hover:bg-slate-900 disabled:opacity-60"
              >
                Buat Password Baru
              </button>
            </div>
            {viewedPassword && (
              <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 flex items-center justify-between">
                <span className="font-mono text-base font-bold text-slate-800">
                  {viewedPassword}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    navigator.clipboard?.writeText(viewedPassword).catch(() => {})
                  }
                  className="text-xs font-semibold text-red-600 hover:text-red-500"
                >
                  Salin
                </button>
              </div>
            )}
            {newCredential && (
              <div
                id="kartu-kredensial-wb"
                className="rounded-xl border-2 border-dashed border-slate-300 p-4 space-y-2 bg-slate-50"
              >
                <p className="text-sm font-bold text-slate-700">
                  Password baru dibuat
                </p>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">
                    Nomor Induk
                  </p>
                  <p className="font-mono text-lg font-bold text-slate-900">
                    {newCredential.nomorInduk}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">
                    Password
                  </p>
                  <p className="font-mono text-lg font-bold text-slate-900">
                    {newCredential.password}
                  </p>
                </div>
                <div className="flex gap-2 kredensial-actions pt-1">
                  <button
                    type="button"
                    onClick={copyCredential}
                    className="flex-1 px-3 py-2 text-sm font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-white"
                  >
                    {copied ? "Tersalin ✓" : "Salin"}
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex-1 px-3 py-2 text-sm font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-white"
                  >
                    Cetak
                  </button>
                </div>
              </div>
            )}
            <p className="text-[11px] text-slate-500">
              &ldquo;Lihat Password&rdquo; untuk dibacakan ke WB yang lupa.
              &ldquo;Buat Password Baru&rdquo; bila password harus diganti.
            </p>
          </>
        ) : (
          <button
            type="button"
            disabled={pwdBusy}
            onClick={handleEmailReset}
            className="w-full px-4 py-2 text-sm font-bold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-60"
          >
            Kirim Email Reset Password
          </button>
        )}
      </Card>

      <Card title="Status Akademik">
        <SelectField
          value={statusForm.status}
          onChange={(val) => setStatusForm({ ...statusForm, status: val })}
          options={[
            { value: "AKTIF", label: "Aktif" },
            { value: "NONAKTIF", label: "Nonaktif" },
            { value: "LULUS", label: "Lulus" },
          ]}
        />
        {statusForm.status === "LULUS" && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Tahun Lulus
            </label>
            <SelectField
              value={statusForm.tahunLulus}
              onChange={(val) =>
                setStatusForm({ ...statusForm, tahunLulus: val })
              }
              options={tahunOptions}
            />
          </div>
        )}
        {statusForm.status === "NONAKTIF" && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Terakhir Aktif
            </label>
            <SelectField
              value={statusForm.terakhirAktif}
              onChange={(val) =>
                setStatusForm({ ...statusForm, terakhirAktif: val })
              }
              options={tahunOptions}
            />
          </div>
        )}
        <button
          type="button"
          disabled={savingStatus}
          onClick={handleStatusSave}
          className="w-full px-4 py-2 text-sm bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-900 disabled:opacity-60"
        >
          {savingStatus ? "Menyimpan…" : "Update Status"}
        </button>
      </Card>

      <Card title="Zona Berbahaya">
        <button
          type="button"
          disabled={savingDetail}
          onClick={handleDelete}
          className="w-full px-4 py-2 text-sm font-bold text-rose-700 bg-rose-50 rounded-lg hover:bg-rose-100 disabled:opacity-60"
        >
          Hapus Data WB
        </button>
      </Card>
    </section>
  );
};

// Wrapper: remount penuh saat wbId berubah (pindah antar halaman detail) supaya
// semua state form/loading ter-reset bersih tanpa perlu setState di dalam effect.
const WBDetailRoute = () => {
  const { wbId } = useParams();
  return <WBDetailPage key={wbId} wbId={wbId} />;
};

export default WBDetailRoute;
