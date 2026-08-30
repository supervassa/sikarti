import React from "react";
import SelectField from "./SelectField";

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// Pagination sisi-client yang bisa dipakai ulang untuk tabel mana pun.
// Data sudah dimuat penuh oleh pemanggil; komponen ini hanya mengatur potongan yang tampil.
const Pagination = ({
  page,
  pageSize,
  total,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  onPageChange,
  onPageSizeChange,
  labelItem = "data",
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(total, safePage * pageSize);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50 text-sm text-slate-600">
      <div className="flex items-center gap-2">
        <span>Tampilkan</span>
        <SelectField
          className="w-24"
          value={pageSize}
          onChange={(val) => onPageSizeChange(Number(val))}
          options={pageSizeOptions}
        />
        <span>{labelItem} / halaman</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-slate-500">
          Menampilkan <span className="font-semibold text-slate-700">{from}</span>
          –<span className="font-semibold text-slate-700">{to}</span> dari{" "}
          <span className="font-semibold text-slate-700">{total}</span>
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage <= 1}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Sebelumnya
          </button>
          <span className="px-2 text-slate-500 whitespace-nowrap">
            Hal. {safePage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage >= totalPages}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Berikutnya
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
