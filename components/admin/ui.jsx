"use client";

import { formatApiErrorDetail } from "@/lib/api";

// API errors carry a `detail`; direct Cloudinary uploads and network failures throw plain Errors.
export const errorText = (error) =>
  error.response ? formatApiErrorDetail(error.response.data?.detail) : error.message || "Something went wrong. Please try again.";

export function Toggle({ on, onClick, children, testid, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      data-testid={testid}
      title={title}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
        on ? "bg-mint text-bg" : "bg-ink/5 text-muted hover:bg-ink/10 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

export function IconButton({ label, onClick, disabled, danger, active, children, testid, className = "" }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      data-testid={testid}
      className={`grid h-8 w-8 place-items-center rounded-full backdrop-blur-md transition-colors disabled:opacity-30 ${
        active
          ? "bg-butter text-bg"
          : danger
            ? "bg-bg/70 text-muted hover:bg-red-500/20 hover:text-red-400"
            : "bg-bg/70 text-ink hover:bg-ink hover:text-bg"
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function Modal({ children, onClose, labelledBy, busy = false, className = "" }) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      onClick={() => !busy && onClose()}
    >
      <div onClick={(e) => e.stopPropagation()} className={`card max-h-[92vh] w-full overflow-y-auto rounded-b-none sm:rounded-b-3xl ${className}`}>
        {children}
      </div>
    </div>
  );
}
