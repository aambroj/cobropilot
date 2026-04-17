import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { getCurrentUser } from "@/lib/auth";

type PanelTopbarProps = {
  currentPath: string;
};

const labels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/clientes": "Clientes",
  "/facturas": "Facturas",
  "/recordatorios": "Recordatorios",
  "/cuenta": "Cuenta",
};

export default async function PanelTopbar({ currentPath }: PanelTopbarProps) {
  const currentLabel = labels[currentPath] ?? "CobroPilot";
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-4 md:px-6 lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            CobroPilot
          </p>
          <h1 className="mt-1 text-xl font-bold text-slate-900">
            {currentLabel}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-right sm:block">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Sesión
              </p>
              <p className="text-sm font-semibold text-slate-900">
                {user.name || user.email}
              </p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
          ) : null}

          <Link
            href="/"
            className="inline-flex rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Ver portada
          </Link>

          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
