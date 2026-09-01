import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faBullhorn } from "@fortawesome/free-solid-svg-icons";
import { pushNotification } from "../../services/notificationServices";
import SelectField from "../common/SelectField";

const PAKET_OPT = [
  { value: "", label: "Semua paket" },
  { value: "Paket A", label: "Paket A" },
  { value: "Paket B", label: "Paket B" },
  { value: "Paket C", label: "Paket C" },
];

// Compose broadcast — hanya untuk admin & superadmin (dijaga juga di firestore.rules).
// onClose(true) dipanggil setelah kirim sukses, onClose(false) saat batal.
const BroadcastModal = ({ actor, onClose }) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [semua, setSemua] = useState(true);
  const [toWb, setToWb] = useState(false);
  const [wbPaket, setWbPaket] = useState("");
  const [toPengajar, setToPengajar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const buildAudiences = () => {
    if (semua) return ["all"];
    const a = [];
    if (toWb) a.push(wbPaket ? `wb:${wbPaket}` : "wb");
    if (toPengajar) a.push("pengajar");
    return a;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (title.trim().length < 3) {
      setError("Judul minimal 3 karakter.");
      return;
    }
    if (body.trim().length < 3) {
      setError("Isi pesan minimal 3 karakter.");
      return;
    }
    const audiences = buildAudiences();
    if (audiences.length === 0) {
      setError("Pilih minimal satu penerima.");
      return;
    }
    setSaving(true);
    try {
      await pushNotification(
        {
          category: "broadcast",
          title: title.trim(),
          body: body.trim(),
          audiences,
        },
        actor,
      );
      onClose(true);
    } catch (err) {
      setError("Gagal mengirim notifikasi: " + err.message);
      setSaving(false);
    }
  };

  const cbClass = (on) =>
    `flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm font-medium cursor-pointer transition-all ${
      on
        ? "border-red-500 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
    }`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl my-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FontAwesomeIcon
              icon={faBullhorn}
              className="w-4 h-4 text-red-600"
            />
            Buat Broadcast
          </h2>
          <button
            type="button"
            onClick={() => onClose(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Judul
            </label>
            <input
              required
              type="text"
              maxLength={150}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-red-500 bg-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Isi Pesan
            </label>
            <textarea
              required
              rows={3}
              maxLength={1000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-red-500 bg-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
              Penerima
            </label>
            <div className="space-y-2">
              <label className={cbClass(semua)}>
                <input
                  type="checkbox"
                  checked={semua}
                  onChange={(e) => setSemua(e.target.checked)}
                  className="accent-red-600"
                />
                Semua (WB &amp; Pengajar)
              </label>

              {!semua && (
                <div className="space-y-2 pl-1">
                  <label className={cbClass(toWb)}>
                    <input
                      type="checkbox"
                      checked={toWb}
                      onChange={(e) => setToWb(e.target.checked)}
                      className="accent-red-600"
                    />
                    Warga Belajar
                  </label>
                  {toWb && (
                    <div className="pl-7">
                      <SelectField
                        value={wbPaket}
                        onChange={setWbPaket}
                        options={PAKET_OPT}
                      />
                    </div>
                  )}
                  <label className={cbClass(toPengajar)}>
                    <input
                      type="checkbox"
                      checked={toPengajar}
                      onChange={(e) => setToPengajar(e.target.checked)}
                      className="accent-red-600"
                    />
                    Pengajar
                  </label>
                </div>
              )}
            </div>
          </div>

          {error && (
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-60"
            >
              {saving ? "Mengirim…" : "Kirim"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BroadcastModal;
