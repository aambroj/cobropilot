import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import PanelShell from "@/components/PanelShell";

type EditarFacturaPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDateInput(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
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

async function updateInvoice(formData: FormData) {
  "use server";

  const invoiceId = String(formData.get("invoiceId") ?? "").trim();

  if (!invoiceId) return;

  const user = await requireUser();

  if (!user) return;

  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      userId: user.id,
    },
  });

  if (!invoice) return;

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
  const normalizedStatus = validStatuses.includes(
    status as (typeof validStatuses)[number]
  )
    ? (status as "PENDING" | "OVERDUE" | "PAID" | "CANCELLED")
    : "PENDING";

  await prisma.invoice.update({
    where: {
      id: invoice.id,
    },
    data: {
      customerId,
      concept,
      invoiceNumber: invoiceNumber || null,
      amount,
      dueDate,
      status: normalizedStatus,
      notes: notes || null,
      paidAt: normalizedStatus === "PAID" ? invoice.paidAt ?? new Date() : null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/facturas");
  revalidatePath(`/facturas/${invoice.id}`);
  revalidatePath(`/facturas/${invoice.id}/editar`);
  revalidatePath("/recordatorios");

  redirect(`/facturas/${invoice.id}`);
}

export default async function EditarFacturaPage({
  params,
}: EditarFacturaPageProps) {
  const { id } = await params;
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
              Antes de editar facturas, carga los datos demo o crea el primer
              usuario.
            </p>
            <Link
              href="/facturas"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold !text-white transition hover:bg-slate-800"
            >
              Volver a facturas
            </Link>
          </div>
        </div>
      </PanelShell>
    );
  }

  const [invoice, customers] = await Promise.all([
    prisma.invoice.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        customer: true,
        _count: {
          select: {
            reminders: true,
          },
        },
      },
    }),
    prisma.customer.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  if (!invoice) {
    notFound();
  }

  return (
    <PanelShell currentPath="/facturas">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[32px] border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
                CobroPilot
              </p>
              <h1 className="mt-3 text-3xl font-black md:text-4xl">
                Editar factura
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-200 md:text-base">
                Modifica cliente, concepto, importe, vencimiento, estado y notas
                desde una sola pantalla.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/facturas/${invoice.id}/eliminar`}
                className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                Eliminar factura
              </Link>
              <Link
                href={`/facturas/${invoice.id}`}
                className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold !text-slate-900 transition hover:bg-slate-100"
              >
                Ver factura
              </Link>
              <Link
                href="/facturas"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold !text-white backdrop-blur-sm transition hover:bg-white/15"
              >
                Lista de facturas
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
                  <span className="font-medium text-slate-900">Cliente:</span>{" "}
                  {invoice.customer.name}
                </p>
                <p>
                  <span className="font-medium text-slate-900">Número:</span>{" "}
                  {invoice.invoiceNumber || "Sin número"}
                </p>
                <p>
                  <span className="font-medium text-slate-900">Importe:</span>{" "}
                  {formatCurrency(Number(invoice.amount))}
                </p>
                <p>
                  <span className="font-medium text-slate-900">Estado:</span>{" "}
                  {getInvoiceStatusLabel(invoice.status)}
                </p>
                <p>
                  <span className="font-medium text-slate-900">Recordatorios:</span>{" "}
                  {invoice._count.reminders}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <h2 className="text-xl font-bold text-slate-900">Notas</h2>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm leading-6 text-slate-700">
                  Edita esta factura sin salir del flujo del panel y vuelve a su
                  ficha con todo actualizado.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <h2 className="text-xl font-bold text-slate-900">
              Datos de la factura
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Modifica lo que necesites y guarda los cambios.
            </p>

            <form action={updateInvoice} className="mt-6 space-y-4">
              <input type="hidden" name="invoiceId" value={invoice.id} />

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Cliente
                </label>
                <select
                  name="customerId"
                  required
                  defaultValue={invoice.customerId}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                >
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
                  defaultValue={invoice.concept}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Número de factura
                </label>
                <input
                  name="invoiceNumber"
                  defaultValue={invoice.invoiceNumber ?? ""}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900"
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
                    defaultValue={Number(invoice.amount).toFixed(2)}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900"
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
                    defaultValue={formatDateInput(invoice.dueDate)}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Estado
                  </label>
                  <select
                    name="status"
                    defaultValue={invoice.status}
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
                  rows={5}
                  defaultValue={invoice.notes ?? ""}
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
                  href={`/facturas/${invoice.id}`}
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
