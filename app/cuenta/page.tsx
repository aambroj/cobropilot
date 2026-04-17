import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import PanelShell from "@/components/PanelShell";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type CuentaPageProps = {
  searchParams?: Promise<{
    success?: string;
  }>;
};

async function updateAccount(formData: FormData) {
  "use server";

  const user = await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const companyName = String(formData.get("companyName") ?? "").trim();

  if (!email || !email.includes("@")) {
    redirect("/cuenta");
  }

  const existing = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existing && existing.id !== user.id) {
    redirect("/cuenta");
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

  return (
    <PanelShell currentPath="/cuenta">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white shadow-sm md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
            CobroPilot
          </p>
          <h1 className="mt-3 text-3xl font-bold md:text-4xl">Cuenta</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-200 md:text-base">
            Ajusta tus datos básicos de acceso y la empresa que aparece en el panel.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
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
                  <span className="font-medium text-slate-900">ID:</span>{" "}
                  {user.id}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <h2 className="text-xl font-bold text-slate-900">Notas</h2>
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-800">
                  Autenticación básica de MVP
                </p>
                <p className="mt-2 text-sm text-amber-700">
                  Esta cuenta usa la auth simple que montamos para avanzar rápido. Más adelante se puede cambiar por una autenticación más seria.
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
                className="inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
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
