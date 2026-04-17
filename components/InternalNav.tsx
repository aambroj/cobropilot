import Link from "next/link";

type InternalNavProps = {
  currentPath: string;
};

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/clientes", label: "Clientes" },
  { href: "/facturas", label: "Facturas" },
  { href: "/recordatorios", label: "Recordatorios" },
];

export default function InternalNav({ currentPath }: InternalNavProps) {
  return (
    <nav className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex flex-wrap gap-2">
        {links.map((link) => {
          const isActive = currentPath === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={
                isActive
                  ? "inline-flex rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                  : "inline-flex rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700"
              }
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
