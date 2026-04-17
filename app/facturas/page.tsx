import Link from "next/link";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import PanelShell from "@/components/PanelShell";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);
}

function getInvoiceStatusLabel(status: string) {
  switch (status) {
    case "PENDING":
      return "Pendiente";
    case "OVERDUE":
      return "Vencida";
    case "PAID":
      return "Pagada";
    case "CANCELLED":
      return "Cancelada";
    default:
      return status;
  }
}

function getInvoiceStatusClasses(status: string) {
  switch (status) {
    case "PENDING":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    case "OVERDUE":
      return "bg-rose-50 text-rose-700 border border-rose-200";
    case "PAID":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    case "CANCELLED":
      return "bg-slate-100 text-slate-700 border border-slate-200";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
}

async function createInvoice(formData: FormData) {
  "use server";

  const user = await requireUser();

  if (!user) return;

  const customerId = String(formData.get("customerId") ?? "").trim();
  const concept = String(formData.get("concept") ?? "").trim();
  const invoiceNumber = String(formData.get("invoiceNumber") ?? "").trim();
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const dueDateRaw = String(formData.get("dueDate") ?? "").trim();
  const status = String(formData.get("status") ?? "PENDING").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!customerId || !concept || !amountRaw || !dueDateRaw) {
    return;
  }

  const amount = Number(amountRaw.replace(",", "."));

  if (!Number.isFinite(amount) || amount <= 0) {
    return;
  }

  const dueDate = new Date(`${dueDateRaw}T12:00:00`);

  if (Number.isNaN(dueDate.getTime())) {
    return;
  }

  const validStatuses = ["PENDING", "OVERDUE", "PAID", "CANCELLED"] as const;
  const normalizedStatus = validStatuses.includes(status as (typeof validStatuses)[number])
    ? (status as "PENDING" | "OVERDUE" | "PAID" | "CANCELLED")
    : "PENDING";

  await prisma.invoice.create({
    data: {
      userId: user.id,
      customerId,
      concept,
      invoiceNumber: invoiceNumber || null,
      amount,
      dueDate,
      status: normalizedStatus,
      notes: notes || null,
      paidAt: normalizedStatus === "PAID" ? new Date() : null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/facturas");
  revalidatePath("/recordatorios");
}

async function updateInvoiceStatus(formData: FormData) {
  "use server";

  const user = await requireUser();

  if (!user) return;

  const invoiceId = String(formData.get("invoiceId") ?? "").trim();
  const nextStatus = String(formData.get("nextStatus") ?? "").trim();

  const validStatuses = ["PENDING", "OVERDUE", "PAID", "CANCELLED"] as const;

  if (
    !invoiceId ||
    !validStatuses.includes(nextStatus as (typeof validStatuses)[number])
  ) {
    return;
  }

  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      userId: user.id,
    },
  });

  if (!invoice) return;

  await prisma.invoice.update({
    where: {
      id: invoice.id,
    },
    data: {
      status: nextStatus as "PENDING" | "OVERDUE" | "PAID" | "CANCELLED",
      paidAt: nextStatus === "PAID" ? invoice.paidAt ?? new Date() : null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/facturas");
  revalidatePath("/recordatorios");
}

export default async function FacturasPage() {
  const user = await requireUser();

  if (!user) {
    return (
      <PanelShell currentPath="/facturas">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
              CobroPilot
            </p>
            <h1 className="mt-3 text-3xl font-bold text-slate-900">
              No hay usuario demo
            </h1>
            <p className="mt-3 text-slate-600">
              Antes de entrar en facturas, carga los datos demo o crea el primer
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

  const [customers, invoices] = await Promise.all([
    prisma.customer.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.invoice.findMany({
      where: {
        userId: user.id,
      },
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
      include: {
        customer: true,
        _count: {
          select: {
            reminders: true,
          },
        },
      },
    }),
  ]);

  const pendingCount = invoices.filter((invoice) => invoice.status === "PENDING").length;
  const overdueCount = invoices.filter((invoice) => invoice.status === "OVERDUE").length;
  const paidCount = invoices.filter((invoice) => invoice.status === "PAID").length;

  const collectibleAmount = invoices
    .filter((invoice) => invoice.status === "PENDING" || invoice.status === "OVERDUE")
    .reduce((acc, invoice) => acc + Number(invoice.amount), 0);

  return (
    <PanelShell currentPath="/facturas">
      <div className="mx-auto max-w-7xl space-y-6">

        <section className="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
                CobroPilot
              </p>
              <h1 className="mt-3 text-3xl font-bold md:text-4xl">Facturas</h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-200 md:text-base">
                Crea facturas, cámbiales el estado rápido, edítalas completas y elimínalas con confirmación.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/clientes"
                className="inline-flex rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm"
              >
                Ver clientes
              </Link>
              <Link
                href="/recordatorios"
                className="inline-flex rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm"
              >
                Ver recordatorios
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total facturas</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{invoices.length}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Pendientes</p>
            <p className="mt-2 text-3xl font-bold text-amber-600">{pendingCount}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Vencidas</p>
            <p className="mt-2 text-3xl font-bold text-rose-600">{overdueCount}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Importe por cobrar</p>
            <p className="mt-2 text-3xl font-bold text-sky-700">
              {formatCurrency(collectibleAmount)}
            </p>
            <p className="mt-1 text-xs text-slate-500">Pagadas: {paidCount}</p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <h2 className="text-xl font-bold text-slate-900">Nueva factura</h2>
            <p className="mt-1 text-sm text-slate-500">
              Asocia el cobro a un cliente y déjalo registrado desde aquí.
            </p>

            {customers.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
                <p className="text-sm text-slate-600">
                  Primero necesitas al menos un cliente para poder crear facturas.
                </p>
                <Link
                  href="/clientes"
                  className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  Ir a clientes
                </Link>
              </div>
            ) : (
              <form action={createInvoice} className="mt-5 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Cliente
                  </label>
                  <select
                    name="customerId"
                    required
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Selecciona un cliente
                    </option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                        {customer.company ? ` · ${customer.company}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Concepto
                  </label>
                  <input
                    name="concept"
                    required
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900"
                    placeholder="Ej. Reparación urgente de fuga"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Número de factura
                  </label>
                  <input
                    name="invoiceNumber"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900"
                    placeholder="Ej. CP-2026-004"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Importe
                    </label>
                    <input
                      name="amount"
                      required
                      inputMode="decimal"
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900"
                      placeholder="150,00"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Vencimiento
                    </label>
                    <input
                      name="dueDate"
                      type="date"
                      required
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Estado inicial
                    </label>
                    <select
                      name="status"
                      defaultValue="PENDING"
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                    >
                      <option value="PENDING">Pendiente</option>
                      <option value="OVERDUE">Vencida</option>
                      <option value="PAID">Pagada</option>
                      <option value="CANCELLED">Cancelada</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Notas
                  </label>
                  <textarea
                    name="notes"
                    rows={4}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900"
                    placeholder="Observaciones internas sobre esta factura"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
                >
                  Guardar factura
                </button>
              </form>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Facturas guardadas
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Aquí puedes cambiar el estado con un clic, editarla completa o eliminarla.
                </p>
              </div>
            </div>

            {invoices.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
                <p className="text-sm text-slate-600">
                  Todavía no hay facturas. Usa el formulario para crear la primera.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-slate-900">
                          {invoice.customer.name}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {invoice.invoiceNumber || "Sin número"} · {invoice.concept}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getInvoiceStatusClasses(invoice.status)}`}
                        >
                          {getInvoiceStatusLabel(invoice.status)}
                        </span>
                        <Link
                          href={`/facturas/${invoice.id}/editar`}
                          className="inline-flex rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                        >
                          Editar
                        </Link>
                        <Link
                          href={`/facturas/${invoice.id}/eliminar`}
                          className="inline-flex rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
                        >
                          Eliminar
                        </Link>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
                      <p>
                        <span className="font-medium text-slate-900">Importe:</span>{" "}
                        {formatCurrency(Number(invoice.amount))}
                      </p>
                      <p>
                        <span className="font-medium text-slate-900">Vence:</span>{" "}
                        {formatDate(invoice.dueDate)}
                      </p>
                      <p>
                        <span className="font-medium text-slate-900">Recordatorios:</span>{" "}
                        {invoice._count.reminders}
                      </p>
                      <p>
                        <span className="font-medium text-slate-900">Pagada el:</span>{" "}
                        {invoice.paidAt ? formatDate(invoice.paidAt) : "—"}
                      </p>
                    </div>

                    {invoice.notes ? (
                      <p className="mt-4 text-sm text-slate-700">{invoice.notes}</p>
                    ) : null}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <form action={updateInvoiceStatus}>
                        <input type="hidden" name="invoiceId" value={invoice.id} />
                        <input type="hidden" name="nextStatus" value="PENDING" />
                        <button
                          type="submit"
                          className="inline-flex rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700"
                        >
                          Marcar pendiente
                        </button>
                      </form>

                      <form action={updateInvoiceStatus}>
                        <input type="hidden" name="invoiceId" value={invoice.id} />
                        <input type="hidden" name="nextStatus" value="OVERDUE" />
                        <button
                          type="submit"
                          className="inline-flex rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
                        >
                          Marcar vencida
                        </button>
                      </form>

                      <form action={updateInvoiceStatus}>
                        <input type="hidden" name="invoiceId" value={invoice.id} />
                        <input type="hidden" name="nextStatus" value="PAID" />
                        <button
                          type="submit"
                          className="inline-flex rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"
                        >
                          Marcar pagada
                        </button>
                      </form>

                      <form action={updateInvoiceStatus}>
                        <input type="hidden" name="invoiceId" value={invoice.id} />
                        <input type="hidden" name="nextStatus" value="CANCELLED" />
                        <button
                          type="submit"
                          className="inline-flex rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                        >
                          Cancelar
                        </button>
                      </form>
                    </div>
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
