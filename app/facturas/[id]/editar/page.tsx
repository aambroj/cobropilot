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
  const normalizedStatus = validStatuses.includes(status as (typeof validStatuses)[number])
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
      paidAt:
        normalizedStatus === "PAID"
          ? invoice.paidAt ?? new Date()
          : null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/facturas");
  revalidatePath(`/facturas/${invoice.id}/editar`);
  revalidatePath("/recordatorios");

  redirect("/facturas");
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
              Antes de editar facturas, carga los datos demo o crea el primer usuario.
            </p>
            <Link
              href="/facturas"
              className="mt-6 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
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
      <div className="mx-auto max-w-5xl space-y-6">

        <section className="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
                CobroPilot
              </p>
              <h1 className="mt-3 text-3xl font-bold md:text-4xl">
                Editar factura
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-200 md:text-base">
                Modifica cliente, concepto, importe, vencimiento, estado y notas.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/facturas/${invoice.id}/eliminar`}
                className="inline-flex rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700"
              >
                Eliminar factura
              </Link>
              <Link
                href="/facturas"
                className="inline-flex rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900"
              >
                Volver a facturas
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Cliente actual</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {invoice.customer.name}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Número</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {invoice.invoiceNumber || "Sin número"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Estado</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {invoice.status}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Recordatorios</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {invoice._count.reminders}
              </p>
            </div>
          </div>

          <form action={updateInvoice} className="space-y-4">
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
                className="inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
              >
                Guardar cambios
              </button>

              <Link
                href="/facturas"
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
