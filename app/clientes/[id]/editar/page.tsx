import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import PanelShell from "@/components/PanelShell";

type EditarClientePageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function updateCustomer(formData: FormData) {
  "use server";

  const customerId = String(formData.get("customerId") ?? "").trim();

  if (!customerId) return;

  const user = await requireUser();

  if (!user) return;

  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      userId: user.id,
    },
  });

  if (!customer) return;

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!name) return;

  await prisma.customer.update({
    where: {
      id: customer.id,
    },
    data: {
      name,
      email: email || null,
      phone: phone || null,
      company: company || null,
      notes: notes || null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/clientes");
  revalidatePath(`/clientes/${customer.id}`);

  redirect(`/clientes/${customer.id}`);
}

export default async function EditarClientePage({
  params,
}: EditarClientePageProps) {
  const { id } = await params;
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
              Antes de editar clientes, carga los datos demo o crea el primer
              usuario.
            </p>
            <Link
              href="/clientes"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold !text-white transition hover:bg-slate-800"
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

  return (
    <PanelShell currentPath="/clientes">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[32px] border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
                CobroPilot
              </p>
              <h1 className="mt-3 text-3xl font-black md:text-4xl">
                Editar cliente
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-200 md:text-base">
                Actualiza los datos básicos del cliente y vuelve a su ficha con
                todo ya guardado.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {customer._count.invoices === 0 ? (
                <Link
                  href={`/clientes/${customer.id}/eliminar`}
                  className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                >
                  Eliminar cliente
                </Link>
              ) : null}
              <Link
                href={`/clientes/${customer.id}`}
                className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold !text-slate-900 transition hover:bg-slate-100"
              >
                Volver a la ficha
              </Link>
              <Link
                href="/clientes"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold !text-white backdrop-blur-sm transition hover:bg-white/15"
              >
                Lista de clientes
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.86fr_1.14fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <h2 className="text-xl font-bold text-slate-900">
                Resumen actual
              </h2>

              <div className="mt-5 grid gap-4 text-sm text-slate-700">
                <p>
                  <span className="font-medium text-slate-900">Nombre:</span>{" "}
                  {customer.name}
                </p>
                <p>
                  <span className="font-medium text-slate-900">Empresa:</span>{" "}
                  {customer.company || "—"}
                </p>
                <p>
                  <span className="font-medium text-slate-900">Email:</span>{" "}
                  {customer.email || "—"}
                </p>
                <p>
                  <span className="font-medium text-slate-900">Teléfono:</span>{" "}
                  {customer.phone || "—"}
                </p>
                <p>
                  <span className="font-medium text-slate-900">Facturas:</span>{" "}
                  {customer._count.invoices}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <h2 className="text-xl font-bold text-slate-900">Notas</h2>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm leading-6 text-slate-700">
                  Puedes cambiar datos básicos, mantener notas internas y dejar
                  esta ficha más ordenada antes de seguir con facturas y
                  recordatorios.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <h2 className="text-xl font-bold text-slate-900">
              Datos del cliente
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Modifica lo que necesites y guarda los cambios.
            </p>

            <form action={updateCustomer} className="mt-6 space-y-4">
              <input type="hidden" name="customerId" value={customer.id} />

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nombre
                </label>
                <input
                  name="name"
                  required
                  defaultValue={customer.name}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Empresa
                </label>
                <input
                  name="company"
                  defaultValue={customer.company ?? ""}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    defaultValue={customer.email ?? ""}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Teléfono
                  </label>
                  <input
                    name="phone"
                    defaultValue={customer.phone ?? ""}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Notas
                </label>
                <textarea
                  name="notes"
                  rows={5}
                  defaultValue={customer.notes ?? ""}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900"
                />
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold !text-white transition hover:bg-slate-800"
                >
                  Guardar cambios
                </button>

                <Link
                  href={`/clientes/${customer.id}`}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold !text-slate-700 transition hover:border-slate-300 hover:!text-slate-900"
                >
                  Cancelar
                </Link>
              </div>
            </form>
          </div>
        </section>
      </div>
    </PanelShell>
  );
}
