import Link from "next/link";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import PanelShell from "@/components/PanelShell";
import InvoiceMessageGenerator from "@/components/InvoiceMessageGenerator";

type FacturasPageProps = {
  searchParams?: Promise<{
    status?: string;
    q?: string;
  }>;
};

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

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function diffInDays(a: Date, b: Date) {
  const ms = startOfDay(a).getTime() - startOfDay(b).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
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
      return "border border-amber-200 bg-amber-50 text-amber-700";
    case "OVERDUE":
      return "border border-rose-200 bg-rose-50 text-rose-700";
    case "PAID":
      return "border border-emerald-200 bg-emerald-50 text-emerald-700";
    case "CANCELLED":
      return "border border-slate-200 bg-slate-100 text-slate-700";
    default:
      return "border border-slate-200 bg-slate-100 text-slate-700";
  }
}

function getStatusPriority(status: string) {
  switch (status) {
    case "OVERDUE":
      return 0;
    case "PENDING":
      return 1;
    case "PAID":
      return 2;
    case "CANCELLED":
      return 3;
    default:
      return 4;
  }
}

function buildStatusHref(status: string, q: string) {
  const params = new URLSearchParams();

  if (status !== "ALL") {
    params.set("status", status);
  }

  if (q.trim()) {
    params.set("q", q.trim());
  }

  const query = params.toString();
  return query ? `/facturas?${query}` : "/facturas";
}

function buildCollectionMessages(params: {
  invoiceId: string;
  customerName: string;
  concept: string;
  invoiceNumber: string | null;
  amount: number;
  dueDate: Date;
  status: string;
}) {
  const dueDateText = formatDate(params.dueDate);
  const amountText = formatCurrency(params.amount);
  const reference = params.invoiceNumber
    ? `la factura ${params.invoiceNumber}`
    : "la factura pendiente";
  const conceptText = params.concept ? ` (${params.concept})` : "";
  const daysLate =
    params.status === "OVERDUE"
      ? Math.max(diffInDays(new Date(), params.dueDate), 1)
      : Math.max(diffInDays(new Date(), params.dueDate), 0);

  const amable =
    params.status === "OVERDUE"
      ? daysLate <= 7
        ? `Hola ${params.customerName}, te escribo para recordarte que ${reference}${conceptText} por ${amountText} venció el ${dueDateText} y sigue pendiente. Cuando puedas, ¿me confirmas por favor la previsión de pago? Gracias.`
        : `Hola ${params.customerName}, sigo pendiente de ${reference}${conceptText} por ${amountText}, vencida el ${dueDateText}. ¿Me puedes confirmar por favor cuándo quedará abonada? Gracias.`
      : `Hola ${params.customerName}, te dejo localizada ${reference}${conceptText} por ${amountText}, con vencimiento ${dueDateText}. Cuando puedas, confírmame por favor la previsión de pago. Gracias.`;

  const firme =
    params.status === "OVERDUE"
      ? daysLate <= 14
        ? `Hola ${params.customerName}, sigo pendiente de ${reference}${conceptText} por ${amountText}, vencida el ${dueDateText}. Necesito por favor una fecha concreta de pago para dejarlo actualizado hoy.`
        : `Hola ${params.customerName}, ${reference}${conceptText} por ${amountText} lleva retraso desde el ${dueDateText} y sigue sin abono. Necesito confirmación hoy con fecha concreta de pago.`
      : `Hola ${params.customerName}, te recuerdo que ${reference}${conceptText} por ${amountText} vence el ${dueDateText}. Necesito por favor que me confirmes la fecha prevista de pago para dejarlo controlado.`;

  const muyDirecta =
    params.status === "OVERDUE"
      ? `Hola ${params.customerName}, necesitamos cerrar ${reference}${conceptText} por ${amountText}, vencida el ${dueDateText}${daysLate > 0 ? ` y con ${daysLate} días de retraso` : ""}. Necesito confirmación hoy y fecha exacta de pago.`
      : `Hola ${params.customerName}, necesito dejar confirmada hoy la previsión de pago de ${reference}${conceptText} por ${amountText}, con vencimiento ${dueDateText}. Indícame por favor la fecha exacta prevista.`;

  return [
    {
      key: "amable",
      label: "Amable",
      description: "Suave, correcta y útil para primer contacto.",
      text: amable,
      suggestedChannel: "EMAIL" as const,
      invoiceId: params.invoiceId,
      toneClasses: "border-sky-200 bg-sky-50 text-sky-700",
      buttonClasses: "bg-sky-700 hover:bg-sky-800 !text-white",
    },
    {
      key: "firme",
      label: "Firme",
      description: "Pide fecha concreta y aprieta más.",
      text: firme,
      suggestedChannel:
        params.status === "OVERDUE" ? ("WHATSAPP" as const) : ("EMAIL" as const),
      invoiceId: params.invoiceId,
      toneClasses: "border-amber-200 bg-amber-50 text-amber-700",
      buttonClasses: "bg-slate-900 hover:bg-slate-800 !text-white",
    },
    {
      key: "muy-directa",
      label: "Muy directa",
      description: "Para retrasos serios o falta de respuesta.",
      text: muyDirecta,
      suggestedChannel:
        params.status === "OVERDUE" && daysLate >= 7
          ? ("PHONE" as const)
          : ("WHATSAPP" as const),
      invoiceId: params.invoiceId,
      toneClasses: "border-rose-200 bg-rose-50 text-rose-700",
      buttonClasses: "bg-rose-600 hover:bg-rose-700 !text-white",
    },
  ];
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
  const normalizedStatus = validStatuses.includes(
    status as (typeof validStatuses)[number]
  )
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

export default async function FacturasPage({ searchParams }: FacturasPageProps) {
  const user = await requireUser();

  const resolvedSearchParams = (await searchParams) ?? {};
  const rawStatus = (resolvedSearchParams.status ?? "ALL").trim().toUpperCase();
  const currentStatus = ["ALL", "PENDING", "OVERDUE", "PAID", "CANCELLED"].includes(
    rawStatus
  )
    ? rawStatus
    : "ALL";
  const currentQuery = (resolvedSearchParams.q ?? "").trim();
  const normalizedQuery = normalizeText(currentQuery);

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
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold !text-white transition hover:bg-slate-800"
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

  const sortedInvoices = [...invoices].sort((a, b) => {
    const statusDiff = getStatusPriority(a.status) - getStatusPriority(b.status);
    if (statusDiff !== 0) return statusDiff;
    return a.dueDate.getTime() - b.dueDate.getTime();
  });

  const filteredInvoices = sortedInvoices.filter((invoice) => {
    if (currentStatus !== "ALL" && invoice.status !== currentStatus) {
      return false;

    }
    if (!normalizedQuery) {
      return true;
    }

    const haystack = normalizeText(
      [
        invoice.customer.name,
        invoice.customer.company ?? "",
        invoice.invoiceNumber ?? "",
        invoice.concept,
        invoice.notes ?? "",
      ].join(" ")
    );

    return haystack.includes(normalizedQuery);
  });

  const pendingCount = invoices.filter((invoice) => invoice.status === "PENDING").length;
  const overdueCount = invoices.filter((invoice) => invoice.status === "OVERDUE").length;
  const paidCount = invoices.filter((invoice) => invoice.status === "PAID").length;

  const collectibleAmount = invoices
    .filter((invoice) => invoice.status === "PENDING" || invoice.status === "OVERDUE")
    .reduce((acc, invoice) => acc + Number(invoice.amount), 0);

  return (
    <PanelShell currentPath="/facturas">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[32px] border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
                CobroPilot
              </p>
              <h1 className="mt-3 text-3xl font-black md:text-4xl">
                Facturas y mensajes de cobro
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-200 md:text-base">
                Crea facturas, cambia su estado y saca mensajes listos para copiar en tono amable,
                firme o muy directo según cómo vaya cada cobro.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/clientes"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold !text-white backdrop-blur-sm transition hover:bg-white/15"
              >
                Ver clientes
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
            <p className="text-sm text-slate-500">Total facturas</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{invoices.length}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Pendientes</p>
            <p className="mt-2 text-3xl font-black text-amber-600">{pendingCount}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Vencidas</p>
            <p className="mt-2 text-3xl font-black text-rose-600">{overdueCount}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Importe por cobrar</p>
            <p className="mt-2 text-3xl font-black text-sky-700">
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
                  className="mt-4 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold !text-white transition hover:bg-slate-800"
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
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold !text-white transition hover:bg-slate-800"
                >
                  Guardar factura
                </button>
              </form>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Facturas guardadas
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Cambia el estado, edítala, elimínala o abre mensajes listos para reclamar.
                </p>
              </div>

              <form method="get" className="grid gap-3 lg:grid-cols-[1fr_180px_auto]">
                <input
                  type="text"
                  name="q"
                  defaultValue={currentQuery}
                  placeholder="Buscar por cliente, concepto, número o notas"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900"
                />

                <select
                  name="status"
                  defaultValue={currentStatus}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                >
                  <option value="ALL">Todos los estados</option>
                  <option value="PENDING">Pendientes</option>
                  <option value="OVERDUE">Vencidas</option>
                  <option value="PAID">Pagadas</option>
                  <option value="CANCELLED">Canceladas</option>
                </select>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold !text-white transition hover:bg-slate-800"
                  >
                    Filtrar
                  </button>
                  <Link
                    href="/facturas"
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold !text-slate-800 transition hover:border-slate-300 hover:!text-slate-950"
                  >
                    Limpiar
                  </Link>
                </div>
              </form>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={buildStatusHref("ALL", currentQuery)}
                  className={
                    currentStatus === "ALL"
                      ? "inline-flex rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold !text-white"
                      : "inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold !text-slate-700"
                  }
                >
                  Todas
                </Link>
                <Link
                  href={buildStatusHref("PENDING", currentQuery)}
                  className={
                    currentStatus === "PENDING"
                      ? "inline-flex rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold !text-white"
                      : "inline-flex rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700"
                  }
                >
                  Pendientes
                </Link>
                <Link
                  href={buildStatusHref("OVERDUE", currentQuery)}
                  className={
                    currentStatus === "OVERDUE"
                      ? "inline-flex rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold !text-white"
                      : "inline-flex rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700"
                  }
                >
                  Vencidas
                </Link>
                <Link
                  href={buildStatusHref("PAID", currentQuery)}
                  className={
                    currentStatus === "PAID"
                      ? "inline-flex rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold !text-white"
                      : "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700"
                  }
                >
                  Pagadas
                </Link>
                <Link
                  href={buildStatusHref("CANCELLED", currentQuery)}
                  className={
                    currentStatus === "CANCELLED"
                      ? "inline-flex rounded-full bg-slate-700 px-4 py-2 text-xs font-semibold !text-white"
                      : "inline-flex rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700"
                  }
                >
                  Canceladas
                </Link>
              </div>

              <p className="text-sm text-slate-500">
                Mostrando {filteredInvoices.length} de {sortedInvoices.length} facturas.
              </p>
            </div>

            {filteredInvoices.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
                <p className="text-sm text-slate-600">
                  No hay facturas que coincidan con ese filtro.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {filteredInvoices.map((invoice) => {
                  const messages = buildCollectionMessages({
                    invoiceId: invoice.id,
                    customerName: invoice.customer.name,
                    concept: invoice.concept,
                    invoiceNumber: invoice.invoiceNumber,
                    amount: Number(invoice.amount),
                    dueDate: invoice.dueDate,
                    status: invoice.status,
                  });

                  const canGenerateMessages =
                    invoice.status === "PENDING" || invoice.status === "OVERDUE";

                  return (
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
                            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold !text-white transition hover:bg-slate-800"
                          >
                            Editar
                          </Link>
                          <Link
                            href={`/facturas/${invoice.id}/eliminar`}
                            className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
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
                            className="inline-flex items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                          >
                            Marcar pendiente
                          </button>
                        </form>

                        <form action={updateInvoiceStatus}>
                          <input type="hidden" name="invoiceId" value={invoice.id} />
                          <input type="hidden" name="nextStatus" value="OVERDUE" />
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                          >
                            Marcar vencida
                          </button>
                        </form>

                        <form action={updateInvoiceStatus}>
                          <input type="hidden" name="invoiceId" value={invoice.id} />
                          <input type="hidden" name="nextStatus" value="PAID" />
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                          >
                            Marcar pagada
                          </button>
                        </form>

                        <form action={updateInvoiceStatus}>
                          <input type="hidden" name="invoiceId" value={invoice.id} />
                          <input type="hidden" name="nextStatus" value="CANCELLED" />
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold !text-slate-700 transition hover:border-slate-300 hover:!text-slate-900"
                          >
                            Cancelar
                          </button>
                        </form>
                      </div>

                      {canGenerateMessages ? (
                        <details className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                          <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900">
                            Abrir mensajes de cobro listos para copiar
                          </summary>

                          <p className="mt-3 text-sm text-slate-600">
                            Tienes tres tonos para reclamar esta factura según el momento de cobro y
                            la presión que quieras meter.
                          </p>

                          <InvoiceMessageGenerator options={messages} />
                        </details>
                      ) : (
                        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-4">
                          <p className="text-sm text-slate-500">
                            Los mensajes de cobro solo se muestran en facturas pendientes o vencidas.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </PanelShell>
  );
}
