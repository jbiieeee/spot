import Sidebar from './Sidebar';

export default function Layout({ children, title, subtitle, actions }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 md:flex">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <header className="border-b border-cyan-100 bg-white px-4 py-5 shadow-[inset_0_-1px_0_rgba(14,116,144,0.06)] sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex gap-1.5">
                <span className="h-1 w-8 rounded bg-cyan-600" />
                <span className="h-1 w-3 rounded bg-emerald-500" />
                <span className="h-1 w-3 rounded bg-amber-400" />
              </div>
              <h1 className="text-xl font-semibold text-slate-950">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
          </div>
        </header>
        <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
