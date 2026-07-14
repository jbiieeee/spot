export default function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-cyan-950/35 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-950/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="font-semibold text-slate-950">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-xl leading-none text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            x
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}
