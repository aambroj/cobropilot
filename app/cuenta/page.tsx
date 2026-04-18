import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import PanelShell from "@/components/PanelShell";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type CuentaPageProps = {
  searchParams?: Promise<{
    success?: string;
    error?: string;
  }>;
};

async function updateAccount(formData: FormData) {
  "use server";

  const user = await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const companyName = String(formData.get("companyName") ?? "").trim();

  if (!email || !email.includes("@")) {
    redirect("/cuenta?error=email");
  }

  const existing = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existing && existing.id !== user.id) {
    redirect("/cuenta?error=exists");
  }

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      name: name || null,
      email,
      companyName: companyName || null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/clientes");
  revalidatePath("/facturas");
  revalidatePath("/recordatorios");
  revalidatePath("/cuenta");

  redirect("/cuenta?success=1");
}

export default async function CuentaPage({ searchParams }: CuentaPageProps) {
  const user = await requireUser();
  const resolvedSearchParams = (await searchParams) ?? {};
  const success = resolvedSearchParams.success === "1";
  const error = resolvedSearchParams.error ?? "";

  return (
    <PanelShell currentPath="/cuenta">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[32px] border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
                CobroPilot
              </p>
              <h1 className="mt-3 text-3xl font-black md:text-4xl">Cuenta</h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-200 md:text-base">
                Ajusta tus datos de acceso y la información básica de empresa que
                usarás dentro del panel.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold !text-white backdrop-blur-sm transition hover:bg-white/15"
              >
                Ver dashboard
              </Link>
              <Link
                href="/facturas"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold !text-white backdrop-blur-sm transition hover:bg-white/15"
              >
                Ver facturas
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Nombre actual</p>
            <p className="mt-2 text-xl font-black text-slate-900">
              {user.name || "Sin nombre"}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Email</p>
            <p className="mt-2 break-all text-base font-semibold text-slate-900">
              {user.email}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Empresa</p>
            <p className="mt-2 text-xl font-black text-slate-900">
              {user.companyName || "Sin empresa"}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Tipo de acceso</p>
            <p className="mt-2 text-xl font-black text-slate-900">MVP actual</p>
            <p className="mt-1 text-xs text-slate-500">
              Auth simple para avanzar rápido
            </p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <h2 className="text-xl font-bold text-slate-900">Resumen actual</h2>

              <div className="mt-5 grid gap-4 text-sm text-slate-700">
                <p>
                  <span className="font-medium text-slate-900">Nombre:</span>{" "}
                  {user.name || "—"}
                </p>
                <p>
                  <span className="font-medium text-slate-900">Email:</span>{" "}
                  {user.email}
                </p>
                <p>
                  <span className="font-medium text-slate-900">Empresa:</span>{" "}
                  {user.companyName || "—"}
                </p>
                <p>
                  <span className="font-medium text-slate-900">ID de cuenta:</span>{" "}
                  <span className="break-all">{user.id}</span>
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <h2 className="text-xl font-bold text-slate-900">Notas</h2>

              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-800">
                  Autenticación básica de MVP
                </p>
                <p className="mt-2 text-sm leading-6 text-amber-700">
                  Esta cuenta usa la auth simple que montamos para avanzar más
                  rápido. Más adelante puedes pasarla a una autenticación más
                  completa sin tocar la base funcional del producto.
                </p>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Qué conviene mantener actualizado
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Tu nombre, email y empresa sirven como referencia dentro del
                  panel y ayudan a que el entorno quede más claro y profesional
                  mientras sigues construyendo CobroPilot.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <h2 className="text-xl font-bold text-slate-900">Editar cuenta</h2>
            <p className="mt-1 text-sm text-slate-500">
              Cambia tu nombre, email y empresa visible.
            </p>

            {success ? (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                Los datos de la cuenta se han guardado correctamente.
              </div>
            ) : null}

            {error === "email" ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                Introduce un email válido para guardar los cambios.
              </div>
            ) : null}

            {error === "exists" ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                Ya existe otra cuenta con ese email. Usa uno distinto.
              </div>
            ) : null}

            <form action={updateAccount} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nombre
                </label>
                <input
                  name="name"
                  defaultValue={user.name ?? ""}
                  placeholder="Tu nombre"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue={user.email}
                  placeholder="tuemail@empresa.com"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Empresa
                </label>
                <input
                  name="companyName"
                  defaultValue={user.companyName ?? ""}
                  placeholder="Nombre de tu empresa"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold !text-white transition hover:bg-slate-800"
              >
                Guardar cambios
              </button>
            </form>
          </div>
        </section>
      </div>
    </PanelShell>
  );
}
