import React, { useEffect, useRef, useState } from "react";
import { isInsidePresensiArea } from "../../utils/presensiLokasi";

const PHOTO_WIDTH = 480;

// Sebagian perangkat (mis. tablet dengan kamera depan terpasang miring) menyajikan
// stream kamera terputar 180°, sehingga preview & foto hasil ikut terbalik. Toggle
// "Putar 180°" mengoreksinya dan pilihannya diingat lewat localStorage.
const FLIP_STORAGE_KEY = "presensiCameraFlip";
const readInitialFlip = () => {
  try {
    return localStorage.getItem(FLIP_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
};

// Modal kamera + geolokasi dipakai bareng WB (checkin) dan Pengajar (mulai mengajar).
// Wajib foto + lokasi sebelum bisa submit — itu inti bukti kehadirannya.
const geoSupported =
  typeof navigator !== "undefined" && !!navigator.geolocation;

const CaptureAttendanceModal = ({
  title,
  subtitle,
  watermarkLabel,
  onCancel,
  onSubmit,
  // Presensi WB: bila `onModeChange` diberikan, tampilkan pilihan Luring/Daring.
  // Mode "luring" mewajibkan lokasi berada di area presensi lembaga.
  mode,
  onModeChange,
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [photoDataUrl, setPhotoDataUrl] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [flip, setFlip] = useState(readInitialFlip);

  // Transform preview (selalu dicermin horizontal ala selfie; +180° bila toggle aktif).
  const previewTransform = flip ? "scaleX(-1) rotate(180deg)" : "scaleX(-1)";

  const toggleFlip = () => {
    setFlip((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(FLIP_STORAGE_KEY, next ? "1" : "0");
      } catch {
        // localStorage tidak tersedia — pilihan tetap berlaku untuk sesi ini.
      }
      return next;
    });
  };

  const startCamera = () => {
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() =>
        setCameraError(
          "Gagal mengakses kamera. Aktifkan izin kamera di browser lalu coba lagi.",
        ),
      );
  };

  useEffect(() => {
    if (geoSupported) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () =>
          setLocationError(
            "Gagal mengambil lokasi. Aktifkan izin lokasi lalu coba lagi.",
          ),
        { enableHighAccuracy: true, timeout: 10000 },
      );
    }
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return;

    const height =
      Math.round((video.videoHeight / video.videoWidth) * PHOTO_WIDTH) || 360;
    canvas.width = PHOTO_WIDTH;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    // Samakan orientasi foto dengan preview: cermin horizontal + 180° bila toggle aktif.
    ctx.save();
    ctx.translate(PHOTO_WIDTH, 0);
    ctx.scale(-1, 1);
    if (flip) {
      ctx.translate(PHOTO_WIDTH / 2, height / 2);
      ctx.rotate(Math.PI);
      ctx.translate(-PHOTO_WIDTH / 2, -height / 2);
    }
    ctx.drawImage(video, 0, 0, PHOTO_WIDTH, height);
    ctx.restore();

    // Watermark digambar setelah transform di-reset supaya teks tidak ikut terbalik.
    const label = `${watermarkLabel} · ${new Intl.DateTimeFormat("id-ID", { dateStyle: "short", timeStyle: "medium" }).format(new Date())}`;
    ctx.font = "12px sans-serif";
    const textWidth = ctx.measureText(label).width;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, height - 22, Math.min(PHOTO_WIDTH, textWidth + 16), 22);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(label, 8, height - 7);

    setPhotoDataUrl(canvas.toDataURL("image/jpeg", 0.6));
    streamRef.current?.getTracks().forEach((t) => t.stop());
  };

  const retake = () => {
    setPhotoDataUrl(null);
    startCamera();
  };

  const outsideArea =
    mode === "luring" && !!location && !isInsidePresensiArea(location);
  const canSubmit =
    !!photoDataUrl && !!location && !submitting && !outsideArea;

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      await onSubmit({ fotoBase64: photoDataUrl, lokasi: location, mode });
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {onModeChange && (
          <div>
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              {["luring", "daring"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onModeChange(m)}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg capitalize transition-all ${
                    mode === m
                      ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              {mode === "luring"
                ? "Luring: harus berada di lokasi PKBM."
                : "Daring: dari mana saja, foto tetap wajib."}
            </p>
          </div>
        )}

        <div className="rounded-xl overflow-hidden bg-slate-900 aspect-[4/3] flex items-center justify-center">
          {photoDataUrl ? (
            <img
              src={photoDataUrl}
              alt="Foto presensi"
              className="w-full h-full object-cover"
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: previewTransform }}
            />
          )}
        </div>
        <canvas ref={canvasRef} className="hidden" />

        {!photoDataUrl && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={toggleFlip}
              className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline"
            >
              Gambar terbalik? Putar 180°{flip ? " (aktif)" : ""}
            </button>
          </div>
        )}

        <div className="space-y-1">
          {cameraError && (
            <p className="text-xs text-rose-600">{cameraError}</p>
          )}
          {!geoSupported && (
            <p className="text-xs text-rose-600">
              Perangkat/browser ini tidak mendukung lokasi.
            </p>
          )}
          {geoSupported && locationError && (
            <p className="text-xs text-rose-600">{locationError}</p>
          )}
          {geoSupported && !locationError && !location && (
            <p className="text-xs text-slate-400">Mengambil lokasi…</p>
          )}
          {location && !outsideArea && (
            <p className="text-xs text-emerald-600">
              Lokasi didapat ({location.lat.toFixed(5)},{" "}
              {location.lng.toFixed(5)})
            </p>
          )}
          {outsideArea && (
            <p className="text-xs font-semibold text-rose-600">
              Anda tidak di lokasi presensi
            </p>
          )}
          {submitError && (
            <p className="text-xs text-rose-600">{submitError}</p>
          )}
        </div>

        {!photoDataUrl ? (
          <button
            type="button"
            onClick={takePhoto}
            disabled={!!cameraError}
            className="w-full py-2.5 bg-slate-800 dark:bg-slate-700 text-white rounded-lg font-semibold disabled:opacity-60"
          >
            Ambil Foto
          </button>
        ) : (
          <button
            type="button"
            onClick={retake}
            className="w-full py-2 text-sm text-slate-600 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700 rounded-lg"
          >
            Ambil Ulang
          </button>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 font-semibold"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-60"
          >
            {submitting ? "Menyimpan…" : "Kirim"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CaptureAttendanceModal;
