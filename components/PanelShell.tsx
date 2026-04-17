import Link from "next/link";
import type { ReactNode } from "react";
import PanelSidebar from "@/components/PanelSidebar";
import PanelTopbar from "@/components/PanelTopbar";

type PanelShellProps = {
  currentPath: string;
  children: ReactNode;
};

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/clientes", label: "Clientes" },
  { href: "/facturas", label: "Facturas" },
  { href: "/recordatorios", label: "Recordatorios" },
  { href: "/cuenta", label: "Cuenta" },
];

export default function PanelShell({ currentPath, children }: PanelShellProps) {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">
        <PanelSidebar currentPath={currentPath} />

        <div className="flex min-w-0 flex-1 flex-col">
          <PanelTopbar currentPath={currentPath} />

          <div className="border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
            <nav className="flex gap-2 overflow-x-auto">
              {links.map((link) => {
                const isActive = currentPath === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={
                      isActive
                        ? "whitespace-nowrap rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                        : "whitespace-nowrap rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700"
                    }
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex-1 px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
