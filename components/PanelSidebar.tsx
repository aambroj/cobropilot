import Link from "next/link";

type PanelSidebarProps = {
  currentPath: string;
};

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/clientes", label: "Clientes" },
  { href: "/facturas", label: "Facturas" },
  { href: "/recordatorios", label: "Recordatorios" },
  { href: "/cuenta", label: "Cuenta" },
];

export default function PanelSidebar({ currentPath }: PanelSidebarProps) {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      <div className="border-b border-slate-200 p-6">
        <Link href="/dashboard" className="block">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-700">
            CobroPilot
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            Panel interno
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Clientes, facturas y recordatorios en un solo sitio.
          </p>
        </Link>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {links.map((link) => {
            const isActive = currentPath === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  isActive
                    ? "flex items-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold !text-white shadow-sm"
                    : "flex items-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold !text-slate-700 transition hover:bg-slate-100 hover:!text-slate-950"
                }
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-slate-200 p-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Estado
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            MVP en marcha
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Ya puedes gestionar el flujo base de cobros.
          </p>
        </div>
      </div>
    </aside>
  );
}
