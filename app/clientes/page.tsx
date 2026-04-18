import Link from "next/link";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import PanelShell from "@/components/PanelShell";

type ClientesPageProps = {
  searchParams?: Promise<{
    q?: string;
    scope?: string;
  }>;
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function buildScopeHref(scope: string, q: string) {
  const params = new URLSearchParams();

  if (scope !== "ALL") {
    params.set("scope", scope);
  }

  if (q.trim()) {
    params.set("q", q.trim());
  }

  const query = params.toString();
  return query ? `/clientes?${query}` : "/clientes";
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

export default async function ClientesPage({ searchParams }: ClientesPageProps) {
  const user = await requireUser();

  const resolvedSearchParams = (await searchParams) ?? {};
  const currentQuery = (resolvedSearchParams.q ?? "").trim();
  const normalizedQuery = normalizeText(currentQuery);
  const rawScope = (resolvedSearchParams.scope ?? "ALL").trim().toUpperCase();
  const currentScope = ["ALL", "WITH_INVOICES", "WITHOUT_INVOICES"].includes(rawScope)
    ? rawScope
    : "ALL";

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
              Antes de entrar en clientes, carga los datos demo o crea el primer usuario.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold !text-white transition hover:bg-slate-800"
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

  const sortedCustomers = [...customers].sort((a, b) => {
    const invoiceDiff = b._count.invoices - a._count.invoices;
    if (invoiceDiff !== 0) return invoiceDiff;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const filteredCustomers = sortedCustomers.filter((customer) => {
    if (currentScope === "WITH_INVOICES" && customer._count.invoices === 0) {
      return false;
    }

    if (currentScope === "WITHOUT_INVOICES" && customer._count.invoices > 0) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = normalizeText(
      [
        customer.name,
        customer.company ?? "",
        customer.email ?? "",
        customer.phone ?? "",
        customer.notes ?? "",
      ].join(" ")
    );

    return haystack.includes(normalizedQuery);
  });

  const customersWithInvoices = customers.filter(
    (customer) => customer._count.invoices > 0
  ).length;
  const customersWithoutInvoices = customers.length - customersWithInvoices;
  const totalInvoicesLinked = customers.reduce(
    (acc, customer) => acc + customer._count.invoices,
    0
  );

  return (
    <PanelShell currentPath="/clientes">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[32px] border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
                CobroPilot
              </p>
              <h1 className="mt-3 text-3xl font-black md:text-4xl">Clientes</h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-200 md:text-base">
                Gestiona la base de clientes a los que vas a asociar facturas,
                cobros pendientes y recordatorios desde un solo sitio.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/facturas"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold !text-white backdrop-blur-sm transition hover:bg-white/15"
              >
                Ver facturas
              </Link>
              <Link
                href="/recordatorios"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold !text-white backdrop-blur-sm transition hover:bg-white/15"
              >
                Ver recordatorios
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total clientes</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{customers.length}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Con facturas</p>
            <p className="mt-2 text-3xl font-black text-sky-700">
              {customersWithInvoices}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Sin facturas</p>
            <p className="mt-2 text-3xl font-black text-amber-600">
              {customersWithoutInvoices}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Facturas vinculadas</p>
            <p className="mt-2 text-3xl font-black text-slate-900">
              {totalInvoicesLinked}
            </p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <h2 className="text-xl font-bold text-slate-900">Nuevo cliente</h2>
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
                className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold !text-white transition hover:bg-slate-800"
              >
                Guardar cliente
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Clientes guardados
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Busca rápido y separa quién ya tiene facturas de quién todavía no.
                </p>
              </div>

              <form method="get" className="grid gap-3 lg:grid-cols-[1fr_220px_auto]">
                <input
                  type="text"
                  name="q"
                  defaultValue={currentQuery}
                  placeholder="Buscar por nombre, empresa, email, teléfono o notas"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900"
                />

                <select
                  name="scope"
                  defaultValue={currentScope}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                >
                  <option value="ALL">Todos los clientes</option>
                  <option value="WITH_INVOICES">Con facturas</option>
                  <option value="WITHOUT_INVOICES">Sin facturas</option>
                </select>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold !text-white transition hover:bg-slate-800"
                  >
                    Filtrar
                  </button>
                  <Link
                    href="/clientes"
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold !text-slate-800 transition hover:border-slate-300 hover:!text-slate-950"
                  >
                    Limpiar
                  </Link>
                </div>
              </form>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={buildScopeHref("ALL", currentQuery)}
                  className={
                    currentScope === "ALL"
                      ? "inline-flex rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold !text-white"
                      : "inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold !text-slate-700"
                  }
                >
                  Todos
                </Link>
                <Link
                  href={buildScopeHref("WITH_INVOICES", currentQuery)}
                  className={
                    currentScope === "WITH_INVOICES"
                      ? "inline-flex rounded-full bg-sky-700 px-4 py-2 text-xs font-semibold !text-white"
                      : "inline-flex rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold text-sky-700"
                  }
                >
                  Con facturas
                </Link>
                <Link
                  href={buildScopeHref("WITHOUT_INVOICES", currentQuery)}
                  className={
                    currentScope === "WITHOUT_INVOICES"
                      ? "inline-flex rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold !text-white"
                      : "inline-flex rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700"
                  }
                >
                  Sin facturas
                </Link>
              </div>

              <p className="text-sm text-slate-500">
                Mostrando {filteredCustomers.length} de {customers.length} clientes.
              </p>
            </div>

            {filteredCustomers.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
                <p className="text-sm text-slate-600">
                  No hay clientes que coincidan con ese filtro.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {filteredCustomers.map((customer) => (
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
                        <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                          {customer._count.invoices} facturas
                        </div>
                        <Link
                          href={`/clientes/${customer.id}`}
                          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold !text-slate-700 transition hover:border-slate-300 hover:!text-slate-900"
                        >
                          Ver ficha
                        </Link>
                        <Link
                          href={`/clientes/${customer.id}/editar`}
                          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold !text-white transition hover:bg-slate-800"
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
                        <span className="font-medium text-slate-900">Teléfono:</span>{" "}
                        {customer.phone || "—"}
                      </p>
                      <p>
                        <span className="font-medium text-slate-900">Creado:</span>{" "}
                        {formatDate(customer.createdAt)}
                      </p>
                    </div>

                    {customer.notes ? (
                      <p className="mt-4 text-sm text-slate-700">{customer.notes}</p>
                    ) : null}

                    {customer._count.invoices === 0 ? (
                      <div className="mt-4">
                        <Link
                          href={`/clientes/${customer.id}/eliminar`}
                          className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
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
