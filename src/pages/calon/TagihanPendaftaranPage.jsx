import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import {
  formatCountdown,
  markRegistrationExpired,
  remainingMs,
  uploadPaymentProof,
} from "../../services/registrationServices";

const BANK_INFO = {
  bank: "BCA",
  rekening: "1234567890",
  atasNama: "PKBM KARTINI",
  biaya: "Rp150.000",
};

const Panel = ({ tone = "slate", title, children }) => {
  const tones = {
    slate: "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800",
    green:
      "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30",
    red: "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30",
    blue: "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30",
  };
  return (
    <div className={`rounded-2xl border shadow-sm p-6 ${tones[tone]}`}>
      {title && (
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
          {title}
        </h2>
      )}
      {children}
    </div>
  );
};

const LogoutButton = () => {
  const navigate = useNavigate();
  return (
    <button
      onClick={async () => {
        await signOut(auth);
        navigate("/pendaftaran/login", { replace: true });
      }}
      className="mt-4 px-4 py-2 text-sm bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-900"
    >
      Keluar
    </button>
  );
};

const TagihanPendaftaranPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const uid = currentUser?.uid;

  const [reg, setReg] = useState(currentUser?.registration || null);
  const [, setTick] = useState(0);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const expiredMarked = useRef(false);

  useEffect(() => {
    if (!uid) return undefined;
    return onSnapshot(doc(db, "registrations", uid), (snap) => {
      setReg(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });
  }, [uid]);

  // Detak 1 detik untuk countdown.
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const msLeft = reg ? remainingMs(reg.deadlineAt) : 0;

  useEffect(() => {
    if (
      reg?.status === "MENUNGGU_PEMBAYARAN" &&
      msLeft <= 0 &&
      !expiredMarked.current
    ) {
      expiredMarked.current = true;
      markRegistrationExpired(uid);
    }
  }, [reg?.status, msLeft, uid]);

  const countdown = useMemo(() => formatCountdown(msLeft), [msLeft]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      await uploadPaymentProof(uid, file);
      setFile(null);
    } catch (err) {
      setError(err.message || "Gagal mengunggah bukti pembayaran.");
    } finally {
      setUploading(false);
    }
  };

  if (!reg) {
    return (
      <Panel title="Memuat data pendaftaran…">
        <p className="text-sm text-slate-500">Mohon tunggu sebentar.</p>
      </Panel>
    );
  }

  const status = reg.status;
  const expired =
    status === "KEDALUWARSA" ||
    (status === "MENUNGGU_PEMBAYARAN" && msLeft <= 0);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Informasi Tagihan Pendaftaran
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Selesaikan pembayaran biaya pendaftaran untuk melanjutkan proses
          sebagai Warga Belajar.
        </p>
      </div>

      {expired && (
        <Panel tone="red" title="Masa pembayaran telah berakhir">
          <p className="text-sm text-rose-700 dark:text-rose-300">
            Batas waktu 48 jam untuk pembayaran pendaftaran sudah lewat,
            sehingga akun sementara ini tidak dapat digunakan lagi. Silakan
            hubungi admin PKBM KARTINI bila ingin mendaftar ulang.
          </p>
          <LogoutButton />
        </Panel>
      )}

      {!expired && status === "DITOLAK" && (
        <Panel tone="red" title="Pendaftaran ditolak">
          <p className="text-sm text-rose-700 dark:text-rose-300">
            {reg.rejectionReason || "Pendaftaran Anda ditolak oleh admin."}
          </p>
          <LogoutButton />
        </Panel>
      )}

      {!expired && status === "DIAKTIFKAN" && (
        <Panel tone="green" title="Akun Anda sudah aktif">
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            Akun Anda telah diaktifkan sebagai Warga Belajar. Silakan keluar
            lalu login kembali untuk masuk ke portal WB.
          </p>
          <LogoutButton />
        </Panel>
      )}

      {!expired && status === "LUNAS" && (
        <Panel tone="green" title="Anda telah melunasi pembayaran">
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            Pembayaran pendaftaran Anda sudah diverifikasi admin. Lanjutkan
            dengan melengkapi data diri, data orang tua/wali, dan mengunggah
            dokumen.
          </p>
          <button
            onClick={() => navigate("/pendaftaran/profil")}
            className="mt-4 px-5 py-2.5 text-sm bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700"
          >
            Lengkapi Data Diri
          </button>
        </Panel>
      )}

      {!expired &&
        (status === "MENUNGGU_PEMBAYARAN" ||
          status === "MENUNGGU_VERIFIKASI") && (
          <>
            <Panel tone="blue" title="Sisa waktu pembayaran">
              <p className="font-mono text-4xl font-extrabold tracking-tight text-blue-700 dark:text-blue-300">
                {countdown}
              </p>
              <p className="mt-1 text-xs text-blue-600/80 dark:text-blue-300/80">
                Format jam : menit : detik — dihitung sejak formulir dikirim.
              </p>
            </Panel>

            <Panel title="Cara pembayaran">
              <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                <li>
                  Biaya pendaftaran:{" "}
                  <span className="font-semibold">{BANK_INFO.biaya}</span>
                </li>
                <li>
                  Transfer ke rekening{" "}
                  <span className="font-semibold">
                    {BANK_INFO.bank} {BANK_INFO.rekening}
                  </span>
                </li>
                <li>
                  Atas nama{" "}
                  <span className="font-semibold">{BANK_INFO.atasNama}</span>
                </li>
                <li>Setelah transfer, unggah bukti pembayaran di bawah ini.</li>
              </ul>
            </Panel>

            {status === "MENUNGGU_VERIFIKASI" ? (
              <Panel tone="blue" title="Bukti pembayaran sedang diverifikasi">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Bukti pembayaran Anda sudah diterima dan sedang ditinjau
                  admin. Hitung mundur tetap berjalan sampai pembayaran
                  diverifikasi.
                </p>
                {reg.paymentProof?.base64 && (
                  <img
                    src={reg.paymentProof.base64}
                    alt="Bukti pembayaran"
                    className="mt-3 max-h-56 rounded-lg border border-slate-200 dark:border-slate-700"
                  />
                )}
              </Panel>
            ) : (
              <Panel title="Unggah bukti pembayaran">
                {reg.rejectionReason && (
                  <p className="mb-3 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg p-3">
                    Bukti sebelumnya ditolak: {reg.rejectionReason} Silakan
                    unggah ulang.
                  </p>
                )}
                <form onSubmit={handleUpload} className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                  />
                  {error && <p className="text-sm text-rose-600">{error}</p>}
                  <button
                    type="submit"
                    disabled={!file || uploading}
                    className="px-5 py-2.5 text-sm bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-60"
                  >
                    {uploading ? "Mengunggah…" : "Kirim Bukti Pembayaran"}
                  </button>
                </form>
              </Panel>
            )}
          </>
        )}
    </section>
  );
};

export default TagihanPendaftaranPage;
