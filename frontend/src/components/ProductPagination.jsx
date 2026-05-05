import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ProductPagination({
  page,
  totalPages,
  onPageChange,
  disabled,
  labels = {},
}) {
  const prev = labels.prev ?? "Previous";
  const next = labels.next ?? "Next";

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4 mt-8 flex-wrap">
      <button
        type="button"
        disabled={disabled || page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="flex items-center gap-1 px-4 py-2 rounded-xl bg-white border border-orange-200 text-orange-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-orange-50"
      >
        <ChevronLeft size={18} /> {prev}
      </button>
      <span className="text-gray-700 font-medium">
        {page} / {totalPages}
      </span>
      <button
        type="button"
        disabled={disabled || page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="flex items-center gap-1 px-4 py-2 rounded-xl bg-white border border-orange-200 text-orange-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-orange-50"
      >
        {next} <ChevronRight size={18} />
      </button>
    </div>
  );
}
