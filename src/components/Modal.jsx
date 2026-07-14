export default function Modal({ open, onClose, title, description, eyebrow = 'Transaction', children, footer, size = 'lg' }) {
  if (!open) return null;

  const sizes = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`transaction-enter max-h-[92vh] w-full ${sizes[size] || sizes.lg} overflow-hidden rounded-xl border border-cyan-100/80 bg-white shadow-2xl shadow-cyan-950/20`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-1.5">
          <span className="flex-1 bg-cyan-600" />
          <span className="w-16 bg-emerald-500" />
          <span className="w-10 bg-amber-400" />
        </div>

        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50/80 px-5 py-4">
          <div className="min-w-0">
            <div className="mb-1 text-[10px] font-semibold uppercase text-cyan-700">{eyebrow}</div>
            <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
            {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-slate-200 bg-white text-sm font-semibold text-slate-500 transition-colors hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-900"
            aria-label="Close modal"
          >
            x
          </button>
        </div>

        <div className="max-h-[62vh] overflow-y-auto p-5">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
