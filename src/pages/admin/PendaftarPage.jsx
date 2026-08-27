import React, { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import {
  formatCountdown,
  remainingMs,
} from "../../services/registrationServices";
import {
  activateCalonWB,
  rejectRegistration,
  rejectRegistrationPayment,
  verifyRegistrationPayment,
} from "../../services/adminServices";

const STATUS_META = {
  MENUNGGU_PEMBAYARAN: {
    label: "Menunggu Pembayaran",
    cls: "bg-amber-50 text-amber-700",
  },
  MENUNGGU_VERIFIKASI: {
    label: "Menunggu Verifikasi",
    cls: "bg-blue-50 text-blue-700",
  },
  LUNAS: { label: "Sudah Bayar", cls: "bg-emerald-50 text-emerald-700" },
  DIAKTIFKAN: { label: "Diaktifkan", cls: "bg-slate-100 text-slate-600" },
  KEDALUWARSA: { label: "Kedaluwarsa", cls: "bg-rose-50 text-rose-700" },
  DITOLAK: { label: "Ditolak", cls: "bg-rose-50 text-rose-700" },
};

const FILTERS = ["Semua", ...Object.keys(STATUS_META)];

const fmtDate = (ts) =>
  ts?.toDate
    ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(ts.toDate())
    : "-";

const Badge = ({ status }) => {
  const meta = STATUS_META[status] || {
    label: status || "-",
    cls: "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${meta.cls}`}>
      {meta.label}
    </span>
  );
};

const PendaftarPage = () => {
  const { currentUser } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Semua");
  const [detailId, setDetailId] = useState(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const q = query(
      collection(db, "registrations"),
      orderBy("createdAt", "desc"),
    );
    return onSnapshot(
      q,
      (snap) => {
        setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(
    () =>
      filter === "Semua"
        ? rows
        : rows.filter((r) => (r.status || "MENUNGGU_PEMBAYARAN") === filter),
    [rows, filter],
  );

  // Modal detail selalu dibaca dari data realtime lewat id-nya.
  const detail = detailId ? rows.find((r) => r.id === detailId) || null : null;

  const openDetail = (row) => {
    setDetailId(row.id);
    setReason("");
  };
  const closeDetail = () => setDetailId(null);

  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      alert("Gagal: " + (err.message || "terjadi kesalahan."));
    } finally {
      setBusy(false);
    }
  };

  const sisaWaktu = (row) => {
    if (
      row.status !== "MENUNGGU_PEMBAYARAN" &&
      row.status !== "MENUNGGU_VERIFIKASI"
    )
      return "-";
    const ms = remainingMs(row.deadlineAt);
    return ms <= 0 ? "Habis" : formatCountdown(ms);
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Pendaftar Calon WB
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Verifikasi pembayaran, tinjau data, dan aktifkan calon Warga Belajar
          menjadi WB.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
              filter === f
                ? "bg-red-600 text-white border-red-600"
                : "bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700"
            }`}
          >
            {f === "Semua" ? "Semua" : STATUS_META[f].label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Nama Lengkap</th>
                <th className="px-4 py-4">Program</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Sisa Waktu</th>
                <th className="px-4 py-4">Profil</th>
                <th className="px-6 py-4">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-400">
                    Memuat data pendaftar...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-400">
                    Tidak ada pendaftar pada filter ini.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">
                        {p.namaLengkap}
                      </p>
                      <p className="text-xs text-slate-400">{p.email}</p>
                      <p className="text-xs text-slate-400">{p.noHp || "-"}</p>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-600 dark:text-slate-300">
                      {p.program || "-"}
                    </td>
                    <td className="px-4 py-4">
                      <Badge status={p.status || "MENUNGGU_PEMBAYARAN"} />
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                      {sisaWaktu(p)}
                    </td>
                    <td className="px-4 py-4 text-xs">
                      {p.profileCompletedAt ? (
                        <span className="text-emerald-600 font-bold">
                          Lengkap
                        </span>
                      ) : (
                        <span className="text-slate-400">Belum</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openDetail(p)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Detail Pendaftar
              </h2>
              <Badge status={detail.status || "MENUNGGU_PEMBAYARAN"} />
            </div>

            {/* Data diri */}
            <div className="text-sm grid grid-cols-2 gap-x-4 gap-y-1">
              <p className="text-slate-400 text-xs">Nama</p>
              <p className="font-semibold">{detail.namaLengkap}</p>
              <p className="text-slate-400 text-xs">Email</p>
              <p>{detail.email}</p>
              <p className="text-slate-400 text-xs">No. HP</p>
              <p>{detail.noHp || "-"}</p>
              <p className="text-slate-400 text-xs">NIK</p>
              <p>{detail.nik || "-"}</p>
              <p className="text-slate-400 text-xs">NISN</p>
              <p>{detail.nisn || "-"}</p>
              <p className="text-slate-400 text-xs">TTL</p>
              <p>
                {detail.tempatLahir}, {detail.tanggalLahir}
              </p>
              <p className="text-slate-400 text-xs">Jenis Kelamin</p>
              <p>
                {detail.jenisKelamin === "P"
                  ? "Perempuan"
                  : detail.jenisKelamin === "L"
                    ? "Laki-laki"
                    : "-"}
              </p>
              <p className="text-slate-400 text-xs">Alamat</p>
              <p>{detail.alamat || "-"}</p>
              <p className="text-slate-400 text-xs">Daftar</p>
              <p>{fmtDate(detail.createdAt)}</p>
              <p className="text-slate-400 text-xs">Batas Bayar</p>
              <p>{fmtDate(detail.deadlineAt)}</p>
            </div>

            {/* Pembayaran */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <p className="text-xs font-bold uppercase text-slate-400">
                Pembayaran
              </p>
              {detail.paymentProof?.base64 ? (
                <img
                  src={detail.paymentProof.base64}
                  alt="Bukti pembayaran"
                  className="max-h-60 rounded-lg border border-slate-200 dark:border-slate-700"
                />
              ) : (
                <p className="text-sm text-slate-500">
                  Belum ada bukti pembayaran.
                </p>
              )}
              {detail.status === "LUNAS" && (
                <p className="text-xs text-emerald-600">
                  Diverifikasi {fmtDate(detail.paymentVerifiedAt)}
                </p>
              )}
              {detail.rejectionReason && detail.status !== "DITOLAK" && (
                <p className="text-xs text-amber-600">
                  Catatan penolakan bukti: {detail.rejectionReason}
                </p>
              )}
              {detail.status === "MENUNGGU_VERIFIKASI" && (
                <div className="space-y-2">
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Alasan (wajib bila menolak bukti)"
                    rows="2"
                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-red-500 bg-transparent"
                  />
                  <div className="flex gap-2">
                    <button
                      disabled={busy}
                      onClick={() =>
                        run(() =>
                          verifyRegistrationPayment(detail.id, currentUser),
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-60"
                    >
                      Verifikasi Pembayaran
                    </button>
                    <button
                      disabled={busy || !reason.trim()}
                      onClick={() =>
                        run(() =>
                          rejectRegistrationPayment(
                            detail.id,
                            reason.trim(),
                            currentUser,
                          ),
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 disabled:opacity-60"
                    >
                      Tolak Bukti
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profil lengkap */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <p className="text-xs font-bold uppercase text-slate-400">
                Data Lanjutan
              </p>
              {detail.profileCompletedAt ? (
                <div className="text-sm grid grid-cols-2 gap-x-4 gap-y-1">
                  <p className="text-slate-400 text-xs">Program</p>
                  <p className="font-semibold">{detail.program || "-"}</p>
                  <p className="text-slate-400 text-xs">Nama Wali</p>
                  <p>{detail.namaWali || "-"}</p>
                  <p className="text-slate-400 text-xs">No. HP Wali</p>
                  <p>{detail.noHpWali || "-"}</p>
                  <div className="col-span-2 flex gap-3 mt-1">
                    {detail.dokumen?.pasFoto?.base64 && (
                      <a
                        href={detail.dokumen.pasFoto.base64}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-blue-600 underline"
                      >
                        Pas Foto
                      </a>
                    )}
                    {detail.dokumen?.dokumenPendukung?.base64 && (
                      <a
                        href={detail.dokumen.dokumenPendukung.base64}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-blue-600 underline"
                      >
                        Dokumen Pendukung
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Calon belum melengkapi data lanjutan.
                </p>
              )}
            </div>

            {/* Aksi utama */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <button
                disabled={
                  busy ||
                  !(detail.status === "LUNAS" && detail.profileCompletedAt)
                }
                onClick={() =>
                  run(async () => {
                    await activateCalonWB(detail, currentUser);
                    closeDetail();
                  })
                }
                className="w-full px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:opacity-50"
              >
                Aktifkan sebagai WB
              </button>
              {detail.status === "LUNAS" && !detail.profileCompletedAt && (
                <p className="text-xs text-amber-600">
                  Menunggu calon melengkapi data lanjutan sebelum bisa
                  diaktifkan.
                </p>
              )}
              {!["DIAKTIFKAN", "DITOLAK"].includes(detail.status) && (
                <button
                  disabled={busy || !reason.trim()}
                  onClick={() =>
                    run(async () => {
                      await rejectRegistration(
                        detail.id,
                        reason.trim(),
                        currentUser,
                      );
                      closeDetail();
                    })
                  }
                  className="w-full px-4 py-2 text-sm font-bold text-rose-700 bg-rose-50 rounded-lg hover:bg-rose-100 disabled:opacity-50"
                >
                  Tolak Pendaftaran (isi alasan di atas)
                </button>
              )}
              <button
                onClick={closeDetail}
                className="w-full px-4 py-2 text-sm text-slate-600 dark:text-slate-300 font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default PendaftarPage;
