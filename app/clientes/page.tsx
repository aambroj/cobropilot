import Link from "next/link";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import PanelShell from "@/components/PanelShell";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);
}

async function createCustomer(formData: FormData) {
  "use server";

  const user = await requireUser();

  if (!user) return;

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!name) return;

  await prisma.customer.create({
    data: {
      userId: user.id,
      name,
      email: email || null,
      phone: phone || null,
      company: company || null,
      notes: notes || null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/clientes");
}

export default async function ClientesPage() {
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
              Antes de entrar en clientes, carga los datos demo o crea el primer
              usuario.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Volver al dashboard
            </Link>
          </div>
        </div>
      </PanelShell>
    );
  }

  const customers = await prisma.customer.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: {
          invoices: true,
        },
      },
    },
  });

  return (
    <PanelShell currentPath="/clientes">
      <div className="mx-auto max-w-7xl space-y-6">

        <section className="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white shadow-sm md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
            CobroPilot
          </p>
          <h1 className="mt-3 text-3xl font-bold md:text-4xl">Clientes</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-200 md:text-base">
            Gestiona la base de clientes a los que luego vas a asociar facturas,
            cobros pendientes y recordatorios.
          </p>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <h2 className="text-xl font-bold text-slate-900">
              Nuevo cliente
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Formulario rápido para añadir clientes al sistema.
            </p>

            <form action={createCustomer} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nombre
                </label>
                <input
                  name="name"
                  required
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900"
                  placeholder="Ej. Reformas García"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Empresa
                </label>
                <input
                  name="company"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900"
                  placeholder="Ej. Reformas García SL"
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
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900"
                    placeholder="cliente@empresa.es"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Teléfono
                  </label>
                  <input
                    name="phone"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900"
                    placeholder="600123123"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Notas
                </label>
                <textarea
                  name="notes"
                  rows={4}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900"
                  placeholder="Información útil sobre este cliente"
                />
              </div>

              <button
                type="submit"
                className="inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
              >
                Guardar cliente
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Clientes guardados
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Total actual: {customers.length}
                </p>
              </div>
            </div>

            {customers.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
                <p className="text-sm text-slate-600">
                  Todavía no hay clientes. Usa el formulario para crear el
                  primero.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {customers.map((customer) => (
                  <div
                    key={customer.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-slate-900">
                          {customer.name}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {customer.company || "Sin empresa"}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                          {customer._count.invoices} facturas
                        </div>
                        <Link
                          href={`/clientes/${customer.id}`}
                          className="inline-flex rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                        >
                          Ver ficha
                        </Link>
                        <Link
                          href={`/clientes/${customer.id}/editar`}
                          className="inline-flex rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                        >
                          Editar
                        </Link>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                      <p>
                        <span className="font-medium text-slate-900">Email:</span>{" "}
                        {customer.email || "—"}
                      </p>
                      <p>
                        <span className="font-medium text-slate-900">
                          Teléfono:
                        </span>{" "}
                        {customer.phone || "—"}
                      </p>
                      <p>
                        <span className="font-medium text-slate-900">
                          Creado:
                        </span>{" "}
                        {formatDate(customer.createdAt)}
                      </p>
                    </div>

                    {customer.notes ? (
                      <p className="mt-4 text-sm text-slate-700">
                        {customer.notes}
                      </p>
                    ) : null}

                    {customer._count.invoices === 0 ? (
                      <div className="mt-4">
                        <Link
                          href={`/clientes/${customer.id}/eliminar`}
                          className="inline-flex rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
                        >
                          Eliminar cliente
                        </Link>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </PanelShell>
  );
}
