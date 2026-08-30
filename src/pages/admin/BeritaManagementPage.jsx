import React, { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faMagnifyingGlass,
  faChevronLeft,
  faChevronRight,
  faImage,
  faVideo,
  faUpload,
  faLink,
  faXmark,
  faNewspaper,
  faPen,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";
import {
  createBerita,
  updateBerita,
  deleteBerita,
} from "../../services/adminServices";
import SelectField from "../../components/common/SelectField";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const MAX_UPLOAD_BYTES = 650 * 1024; // ~650KB mentah, aman untuk batas dokumen Firestore setelah di-base64

const emptyForm = {
  title: "",
  deskripsi: "",
  tipeMedia: "gambar",
  mediaType: "upload",
  mediaUrl: "",
  mediaBase64: "",
  fileName: "",
};

const formatTanggal = (timestamp) => {
  if (!timestamp?.toDate) return "-";
  return timestamp
    .toDate()
    .toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
};

const readFileAsBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const BeritaManagementPage = () => {
  const { currentUser } = useAuth();
  const [listBerita, setListBerita] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setListBerita(
        snapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
      );
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return listBerita;
    return listBerita.filter((item) =>
      item.title?.toLowerCase().includes(keyword),
    );
  }, [listBerita, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const resetForm = () => setForm(emptyForm);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    resetForm();
  };

  const openCreate = () => {
    setEditingId(null);
    resetForm();
    setIsModalOpen(true);
  };

  const openEdit = (item) => {
    setForm({
      title: item.title || "",
      deskripsi: item.deskripsi || "",
      tipeMedia: item.tipeMedia || "gambar",
      mediaType:
        item.mediaType || (item.tipeMedia === "video" ? "upload" : "url"),
      mediaUrl: item.mediaUrl || "",
      mediaBase64: item.mediaBase64 || "",
      fileName: item.mediaBase64 ? "(gambar tersimpan)" : "",
    });
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (item) => {
    if (
      !window.confirm(
        `Hapus berita "${item.title}"? Tindakan ini tidak dapat dibatalkan.`,
      )
    )
      return;
    setDeletingId(item.id);
    try {
      await deleteBerita(item.id, currentUser);
    } catch (err) {
      alert("Gagal menghapus berita: " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_UPLOAD_BYTES) {
      alert(
        `Ukuran gambar maksimal ${Math.round(MAX_UPLOAD_BYTES / 1024)}KB. Kompres gambar atau gunakan URL.`,
      );
      e.target.value = "";
      return;
    }

    const base64 = await readFileAsBase64(file);
    setForm((prev) => ({ ...prev, mediaBase64: base64, fileName: file.name }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      form.tipeMedia === "gambar" &&
      form.mediaType === "upload" &&
      !form.mediaBase64
    ) {
      alert("Silakan unggah gambar terlebih dahulu.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        deskripsi: form.deskripsi.trim(),
        tipeMedia: form.tipeMedia,
        mediaType: form.tipeMedia === "gambar" ? form.mediaType : undefined,
        mediaUrl:
          form.tipeMedia === "video" || form.mediaType === "url"
            ? form.mediaUrl.trim()
            : undefined,
        mediaBase64:
          form.tipeMedia === "gambar" && form.mediaType === "upload"
            ? form.mediaBase64
            : undefined,
      };
      if (editingId) {
        await updateBerita(editingId, payload, currentUser);
      } else {
        await createBerita(payload, currentUser);
      }
      closeModal();
    } catch (err) {
      alert(
        `Gagal ${editingId ? "memperbarui" : "menambah"} berita: ` +
          err.message,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Berita & Pengumuman
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Kelola berita dan pengumuman yang tampil di halaman publik PKBM
            KARTINI.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm shadow transition-all flex items-center justify-center gap-2"
        >
          <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
          <span>Tambah Berita</span>
        </button>
      </div>

      {/* Toolbar: Search & Page Size */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 w-full sm:max-w-xs">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="w-3.5 h-3.5 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari judul berita..."
            className="bg-transparent outline-none text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 w-full"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <span>Tampilkan</span>
          <SelectField
            className="w-24"
            value={pageSize}
            onChange={(val) => {
              setPageSize(Number(val));
              setPage(1);
            }}
            options={PAGE_SIZE_OPTIONS}
          />
          <span>data</span>
        </div>
      </div>

      {/* Tabel Berita */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Judul</th>
                <th className="px-4 py-4">Tipe Media</th>
                <th className="px-4 py-4">Penulis</th>
                <th className="px-4 py-4">Tanggal</th>
                <th className="px-6 py-4">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-slate-400">
                    Memuat data berita...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-slate-400">
                    <FontAwesomeIcon
                      icon={faNewspaper}
                      className="w-6 h-6 mb-2 opacity-50"
                    />
                    <p>Belum ada data berita.</p>
                  </td>
                </tr>
              ) : (
                paginated.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-900/40"
                  >
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-100 max-w-xs truncate">
                      {item.title}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                        <FontAwesomeIcon
                          icon={item.tipeMedia === "video" ? faVideo : faImage}
                          className="w-3 h-3"
                        />
                        {item.tipeMedia === "video" ? "Video" : "Gambar"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                      {item.author || "-"}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-400">
                      {formatTanggal(item.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                          <FontAwesomeIcon icon={faPen} className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          disabled={deletingId === item.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 disabled:opacity-50"
                        >
                          <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                          {deletingId === item.id ? "Menghapus…" : "Hapus"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
            <span>
              Halaman {currentPage} dari {totalPages} &middot; {filtered.length}{" "}
              berita
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="w-3 h-3" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <FontAwesomeIcon icon={faChevronRight} className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Tambah Berita */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl my-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingId ? "Edit Berita" : "Tambah Berita"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Judul
                </label>
                <input
                  required
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-lg text-sm outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Deskripsi
                </label>
                <textarea
                  required
                  rows={4}
                  value={form.deskripsi}
                  onChange={(e) =>
                    setForm({ ...form, deskripsi: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-lg text-sm outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                  Tipe Media
                </label>
                <div className="flex gap-3">
                  {[
                    { value: "gambar", label: "Gambar", icon: faImage },
                    { value: "video", label: "Video", icon: faVideo },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium cursor-pointer transition-all ${
                        form.tipeMedia === opt.value
                          ? "border-red-500 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                          : "border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      <input
                        type="radio"
                        name="tipeMedia"
                        value={opt.value}
                        checked={form.tipeMedia === opt.value}
                        onChange={() =>
                          setForm({
                            ...form,
                            tipeMedia: opt.value,
                            mediaType: "upload",
                            mediaUrl: "",
                            mediaBase64: "",
                            fileName: "",
                          })
                        }
                        className="hidden"
                      />
                      <FontAwesomeIcon
                        icon={opt.icon}
                        className="w-3.5 h-3.5"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              {form.tipeMedia === "gambar" ? (
                <div className="space-y-3">
                  <div className="flex gap-3">
                    {[
                      { value: "upload", label: "Upload File", icon: faUpload },
                      { value: "url", label: "Dari URL", icon: faLink },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                          form.mediaType === opt.value
                            ? "border-red-500 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                            : "border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        <input
                          type="radio"
                          name="mediaType"
                          value={opt.value}
                          checked={form.mediaType === opt.value}
                          onChange={() =>
                            setForm({
                              ...form,
                              mediaType: opt.value,
                              mediaUrl: "",
                              mediaBase64: "",
                              fileName: "",
                            })
                          }
                          className="hidden"
                        />
                        <FontAwesomeIcon icon={opt.icon} className="w-3 h-3" />
                        {opt.label}
                      </label>
                    ))}
                  </div>

                  {form.mediaType === "upload" ? (
                    <div>
                      <input
                        required={!form.mediaBase64}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 dark:file:bg-slate-700 file:text-slate-600 dark:file:text-slate-200"
                      />
                      {form.fileName && (
                        <p className="text-xs text-slate-400 mt-1">
                          Terpilih: {form.fileName}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-400 mt-1">
                        Maks {Math.round(MAX_UPLOAD_BYTES / 1024)}KB.
                      </p>
                    </div>
                  ) : (
                    <input
                      required
                      type="url"
                      placeholder="https://contoh.com/gambar.jpg"
                      value={form.mediaUrl}
                      onChange={(e) =>
                        setForm({ ...form, mediaUrl: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-lg text-sm outline-none focus:border-red-500"
                    />
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    URL Video
                  </label>
                  <input
                    required
                    type="url"
                    placeholder="https://youtu.be/... atau https://www.tiktok.com/@akun/video/..."
                    value={form.mediaUrl}
                    onChange={(e) =>
                      setForm({ ...form, mediaUrl: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-lg text-sm outline-none focus:border-red-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    YouTube &amp; TikTok tampil sebagai pemutar tersemat. Untuk
                    TikTok, tempel URL <strong>lengkap</strong> (buka link pendek
                    <code className="mx-1">vt.tiktok.com/…</code>di browser, lalu
                    salin alamat <code>www.tiktok.com/@akun/video/…</code>). URL
                    platform lain akan tampil sebagai tautan &ldquo;Tonton
                    video&rdquo;.
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-60"
                >
                  {submitting
                    ? "Menyimpan..."
                    : editingId
                      ? "Perbarui"
                      : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default BeritaManagementPage;
