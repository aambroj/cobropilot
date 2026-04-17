import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import PanelShell from "@/components/PanelShell";

type EliminarClientePageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

async function deleteCustomer(formData: FormData) {
  "use server";

  const customerId = String(formData.get("customerId") ?? "").trim();
  const confirmation = String(formData.get("confirmation") ?? "").trim();

  if (!customerId) return;

  const user = await requireUser();

  if (!user) return;

  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      userId: user.id,
    },
    include: {
      _count: {
        select: {
          invoices: true,
        },
      },
    },
  });

  if (!customer) return;

  if (customer._count.invoices > 0) {
    redirect(`/clientes/${customer.id}/eliminar?error=blocked`);
  }

  if (confirmation !== "ELIMINAR") {
    redirect(`/clientes/${customer.id}/eliminar?error=confirm`);
  }

  await prisma.customer.delete({
    where: {
      id: customer.id,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/clientes");

  redirect("/clientes");
}

export default async function EliminarClientePage({
  params,
  searchParams,
}: EliminarClientePageProps) {
  const { id } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const error = resolvedSearchParams.error ?? "";

  const user = await requireUser();

  if (!user) {
    return (
      <PanelShell currentPath="/clientes">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
              CobroPilot
            </p>
            <h1 className="mt-3 text-3xl font-bold text-slate-900">
              No hay usuario demo
            </h1>
            <p className="mt-3 text-slate-600">
              Antes de eliminar clientes, carga los datos demo o crea el primer usuario.
            </p>
            <Link
              href="/clientes"
              className="mt-6 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Volver a clientes
            </Link>
          </div>
        </div>
      </PanelShell>
    );
  }

  const customer = await prisma.customer.findFirst({
    where: {
      id,
      userId: user.id,
    },
    include: {
      _count: {
        select: {
          invoices: true,
        },
      },
    },
  });

  if (!customer) {
    notFound();
  }

  const isBlocked = customer._count.invoices > 0;

  return (
    <PanelShell currentPath="/clientes">
      <div className="mx-auto max-w-5xl space-y-6">

        <section className="rounded-3xl bg-gradient-to-r from-rose-700 to-rose-600 p-6 text-white shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-100">
                CobroPilot
              </p>
              <h1 className="mt-3 text-3xl font-bold md:text-4xl">
                Eliminar cliente
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-rose-50 md:text-base">
                Acción delicada. Solo se permite eliminar clientes que no tengan facturas asociadas.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/clientes/${customer.id}`}
                className="inline-flex rounded-xl bg-white px-4 py-2 text-sm font-semibold text-rose-700"
              >
                Volver a la ficha
              </Link>
              <Link
                href="/clientes"
                className="inline-flex rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm"
              >
                Lista de clientes
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <h2 className="text-xl font-bold text-slate-900">Comprobación previa</h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Cliente</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {customer.name}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Empresa</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {customer.company || "—"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Email</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {customer.email || "—"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Facturas asociadas</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {customer._count.invoices}
              </p>
            </div>
          </div>

          {isBlocked ? (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-sm font-semibold text-amber-800">
                No se puede eliminar este cliente.
              </p>
              <p className="mt-2 text-sm text-amber-700">
                Tiene facturas asociadas. Para mantener la consistencia del histórico, primero tendrías que gestionar esas facturas.
              </p>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5">
              <p className="text-sm font-semibold text-rose-800">
                Este cliente sí se puede eliminar.
              </p>
              <p className="mt-2 text-sm text-rose-700">
                Para confirmar, escribe exactamente <span className="font-bold">ELIMINAR</span> y pulsa el botón.
              </p>
            </div>
          )}

          {error === "confirm" ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              La confirmación no coincide. Escribe exactamente ELIMINAR.
            </div>
          ) : null}

          {error === "blocked" ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
              Este cliente ya no puede eliminarse porque ahora tiene facturas asociadas.
            </div>
          ) : null}

          <form action={deleteCustomer} className="mt-6 space-y-4">
            <input type="hidden" name="customerId" value={customer.id} />

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Confirmación
              </label>
              <input
                name="confirmation"
                disabled={isBlocked}
                placeholder="Escribe ELIMINAR"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 focus:border-slate-900"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isBlocked}
                className="inline-flex rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Eliminar definitivamente
              </button>

              <Link
                href={`/clientes/${customer.id}`}
                className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </section>
      </div>
    </PanelShell>
  );
}
