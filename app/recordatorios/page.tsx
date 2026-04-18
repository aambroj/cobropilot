import Link from "next/link";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import PanelShell from "@/components/PanelShell";

type RecordatoriosPageProps = {
  searchParams?: Promise<{
    invoiceId?: string;
    channel?: string;
    message?: string;
    status?: string;
    q?: string;
    filterChannel?: string;
  }>;
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getChannelLabel(channel: string) {
  switch (channel) {
    case "EMAIL":
      return "Email";
    case "WHATSAPP":
      return "WhatsApp";
    case "PHONE":
      return "Teléfono";
    default:
      return channel;
  }
}

function getReminderStatusLabel(status: string) {
  switch (status) {
    case "PENDING":
      return "Pendiente";
    case "SENT":
      return "Enviado";
    case "FAILED":
      return "Fallido";
    case "CANCELLED":
      return "Cancelado";
    default:
      return status;
  }
}

function getReminderStatusClasses(status: string) {
  switch (status) {
    case "PENDING":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    case "SENT":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
    case "FAILED":
      return "bg-rose-50 text-rose-700 border border-rose-200";
    case "CANCELLED":
      return "bg-slate-100 text-slate-700 border border-slate-200";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
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

function buildFilterHref(params: {
  status: string;
  filterChannel: string;
  q: string;
}) {
  const search = new URLSearchParams();

  if (params.status !== "ALL") {
    search.set("status", params.status);
  }

  if (params.filterChannel !== "ALL") {
    search.set("filterChannel", params.filterChannel);
  }

  if (params.q.trim()) {
    search.set("q", params.q.trim());
  }

  const query = search.toString();
  return query ? `/recordatorios?${query}` : "/recordatorios";
}

async function createReminder(formData: FormData) {
  "use server";

  const user = await requireUser();

  if (!user) return;

  const invoiceId = String(formData.get("invoiceId") ?? "").trim();
  const channel = String(formData.get("channel") ?? "").trim();
  const scheduledAtRaw = String(formData.get("scheduledAt") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!invoiceId || !channel || !scheduledAtRaw) return;

  const scheduledAt = new Date(scheduledAtRaw);
  if (Number.isNaN(scheduledAt.getTime())) return;

  await prisma.reminder.create({
    data: {
      userId: user.id,
      invoiceId,
      channel: channel as "EMAIL" | "WHATSAPP" | "PHONE",
      scheduledAt,
      status: "PENDING",
      message: message || null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/facturas");
  revalidatePath("/recordatorios");
}

async function updateReminderStatus(formData: FormData) {
  "use server";

  const user = await requireUser();

  if (!user) return;

  const reminderId = String(formData.get("reminderId") ?? "").trim();
  const nextStatus = String(formData.get("nextStatus") ?? "").trim();

  const validStatuses = ["PENDING", "SENT", "FAILED", "CANCELLED"] as const;

  if (
    !reminderId ||
    !validStatuses.includes(nextStatus as (typeof validStatuses)[number])
  ) {
    return;
  }

  const reminder = await prisma.reminder.findFirst({
    where: {
      id: reminderId,
      userId: user.id,
    },
  });

  if (!reminder) return;

  await prisma.reminder.update({
    where: {
      id: reminder.id,
    },
    data: {
      status: nextStatus as "PENDING" | "SENT" | "FAILED" | "CANCELLED",
      sentAt: nextStatus === "SENT" ? reminder.sentAt ?? new Date() : null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/facturas");
  revalidatePath("/recordatorios");
}

export default async function RecordatoriosPage({
  searchParams,
}: RecordatoriosPageProps) {
  const user = await requireUser();

  const resolvedSearchParams = (await searchParams) ?? {};
  const prefilledInvoiceId = resolvedSearchParams.invoiceId?.trim() ?? "";
  const prefilledChannel = ["EMAIL", "WHATSAPP", "PHONE"].includes(
    resolvedSearchParams.channel ?? ""
  )
    ? (resolvedSearchParams.channel as "EMAIL" | "WHATSAPP" | "PHONE")
    : "EMAIL";
  const prefilledMessage = resolvedSearchParams.message?.trim() ?? "";

  const rawStatus = (resolvedSearchParams.status ?? "ALL").trim().toUpperCase();
  const currentStatus = ["ALL", "PENDING", "SENT", "FAILED", "CANCELLED"].includes(
    rawStatus
  )
    ? rawStatus
    : "ALL";

  const rawFilterChannel = (resolvedSearchParams.filterChannel ?? "ALL")
    .trim()
    .toUpperCase();
  const currentFilterChannel = ["ALL", "EMAIL", "WHATSAPP", "PHONE"].includes(
    rawFilterChannel
  )
    ? rawFilterChannel
    : "ALL";

  const currentQuery = (resolvedSearchParams.q ?? "").trim();
  const normalizedQuery = normalizeText(currentQuery);

  if (!user) {
    return (
      <PanelShell currentPath="/recordatorios">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
              CobroPilot
            </p>
            <h1 className="mt-3 text-3xl font-bold text-slate-900">
              No hay usuario demo
            </h1>
            <p className="mt-3 text-slate-600">
              Antes de entrar en recordatorios, carga los datos demo o crea el primer usuario.
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

  const [invoices, reminders] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        userId: user.id,
      },
      orderBy: [
        {
          dueDate: "asc",
        },
        {
          createdAt: "desc",
        },
      ],
      include: {
        customer: true,
      },
    }),
    prisma.reminder.findMany({
      where: {
        userId: user.id,
      },
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
      include: {
        invoice: {
          include: {
            customer: true,
          },
        },
      },
    }),
  ]);

  const pendingCount = reminders.filter((reminder) => reminder.status === "PENDING").length;
  const sentCount = reminders.filter((reminder) => reminder.status === "SENT").length;
  const cancelledCount = reminders.filter((reminder) => reminder.status === "CANCELLED").length;

  const prefilledInvoice = prefilledInvoiceId
    ? invoices.find((invoice) => invoice.id === prefilledInvoiceId) ?? null
    : null;

  const filteredReminders = reminders.filter((reminder) => {
    if (currentStatus !== "ALL" && reminder.status !== currentStatus) {
      return false;
    }

    if (currentFilterChannel !== "ALL" && reminder.channel !== currentFilterChannel) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = normalizeText(
      [
        reminder.invoice.customer.name,
        reminder.invoice.customer.company ?? "",
        reminder.invoice.invoiceNumber ?? "",
        reminder.invoice.concept,
        reminder.message ?? "",
        getChannelLabel(reminder.channel),
        getReminderStatusLabel(reminder.status),
      ].join(" ")
    );

    return haystack.includes(normalizedQuery);
  });

  return (
    <PanelShell currentPath="/recordatorios">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
                CobroPilot
              </p>
              <h1 className="mt-3 text-3xl font-bold md:text-4xl">
                Recordatorios
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-200 md:text-base">
                Programa avisos de cobro, cambia su estado rápido y edítalos o elimínalos individualmente.
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
                href="/clientes"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold !text-white backdrop-blur-sm transition hover:bg-white/15"
              >
                Ver clientes
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total recordatorios</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{reminders.length}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Pendientes</p>
            <p className="mt-2 text-3xl font-bold text-amber-600">{pendingCount}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Enviados</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">{sentCount}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Cancelados</p>
            <p className="mt-2 text-3xl font-bold text-slate-700">{cancelledCount}</p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <h2 className="text-xl font-bold text-slate-900">
              Nuevo recordatorio
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Crea un aviso manual asociado a una factura.
            </p>

            {prefilledInvoice ? (
              <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 p-4">
                <p className="text-sm font-semibold text-sky-800">
                  Has llegado desde Facturas con un mensaje ya preparado.
                </p>
                <p className="mt-2 text-sm text-sky-700">
                  Factura: {prefilledInvoice.invoiceNumber || "Sin número"} ·{" "}
                  {prefilledInvoice.customer.name} ·{" "}
                  {formatCurrency(Number(prefilledInvoice.amount))}
                </p>
              </div>
            ) : null}

            {invoices.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
                <p className="text-sm text-slate-600">
                  Primero necesitas al menos una factura para poder crear recordatorios.
                </p>
                <Link
                  href="/facturas"
                  className="mt-4 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold !text-white transition hover:bg-slate-800"
                >
                  Ir a facturas
                </Link>
              </div>
            ) : (
              <form action={createReminder} className="mt-5 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Factura
                  </label>
                  <select
                    name="invoiceId"
                    required
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                    defaultValue={prefilledInvoiceId || ""}
                  >
                    <option value="" disabled>
                      Selecciona una factura
                    </option>
                    {invoices.map((invoice) => (
                      <option key={invoice.id} value={invoice.id}>
                        {invoice.customer.name} · {invoice.invoiceNumber || "Sin número"} · {formatCurrency(Number(invoice.amount))} · {getInvoiceStatusLabel(invoice.status)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Canal
                    </label>
                    <select
                      name="channel"
                      required
                      defaultValue={prefilledChannel}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                    >
                      <option value="EMAIL">Email</option>
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="PHONE">Teléfono</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Fecha y hora
                    </label>
                    <input
                      name="scheduledAt"
                      type="datetime-local"
                      required
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Mensaje
                  </label>
                  <textarea
                    name="message"
                    rows={5}
                    defaultValue={prefilledMessage}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900"
                    placeholder="Ej. Hola, te escribo para recordarte que la factura sigue pendiente de pago."
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold !text-white transition hover:bg-slate-800"
                >
                  Guardar recordatorio
                </button>
              </form>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Recordatorios guardados
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Filtra, busca y cambia el estado rápido desde aquí.
                </p>
              </div>

              <form method="get" className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
                <div className="min-w-0">
                  <input
                    type="text"
                    name="q"
                    defaultValue={currentQuery}
                    placeholder="Buscar por cliente, mensaje, factura o canal"
                    className="w-full min-w-0 rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900"
                  />
                </div>

                <div className="min-w-0">
                  <select
                    name="status"
                    defaultValue={currentStatus}
                    className="w-full min-w-0 rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                  >
                    <option value="ALL">Todos los estados</option>
                    <option value="PENDING">Pendientes</option>
                    <option value="SENT">Enviados</option>
                    <option value="FAILED">Fallidos</option>
                    <option value="CANCELLED">Cancelados</option>
                  </select>
                </div>

                <div className="min-w-0">
                  <select
                    name="filterChannel"
                    defaultValue={currentFilterChannel}
                    className="w-full min-w-0 rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                  >
                    <option value="ALL">Todos los canales</option>
                    <option value="EMAIL">Email</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="PHONE">Teléfono</option>
                  </select>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold !text-white transition hover:bg-slate-800"
                  >
                    Filtrar
                  </button>
                  <Link
                    href="/recordatorios"
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold !text-slate-800 transition hover:border-slate-300 hover:!text-slate-950"
                  >
                    Limpiar
                  </Link>
                </div>
              </form>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={buildFilterHref({
                    status: "ALL",
                    filterChannel: currentFilterChannel,
                    q: currentQuery,
                  })}
                  className={
                    currentStatus === "ALL"
                      ? "inline-flex rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold !text-white"
                      : "inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold !text-slate-700"
                  }
                >
                  Todos
                </Link>
                <Link
                  href={buildFilterHref({
                    status: "PENDING",
                    filterChannel: currentFilterChannel,
                    q: currentQuery,
                  })}
                  className={
                    currentStatus === "PENDING"
                      ? "inline-flex rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold !text-white"
                      : "inline-flex rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700"
                  }
                >
                  Pendientes
                </Link>
                <Link
                  href={buildFilterHref({
                    status: "SENT",
                    filterChannel: currentFilterChannel,
                    q: currentQuery,
                  })}
                  className={
                    currentStatus === "SENT"
                      ? "inline-flex rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold !text-white"
                      : "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700"
                  }
                >
                  Enviados
                </Link>
                <Link
                  href={buildFilterHref({
                    status: "FAILED",
                    filterChannel: currentFilterChannel,
                    q: currentQuery,
                  })}
                  className={
                    currentStatus === "FAILED"
                      ? "inline-flex rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold !text-white"
                      : "inline-flex rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700"
                  }
                >
                  Fallidos
                </Link>
                <Link
                  href={buildFilterHref({
                    status: "CANCELLED",
                    filterChannel: currentFilterChannel,
                    q: currentQuery,
                  })}
                  className={
                    currentStatus === "CANCELLED"
                      ? "inline-flex rounded-full bg-slate-700 px-4 py-2 text-xs font-semibold !text-white"
                      : "inline-flex rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700"
                  }
                >
                  Cancelados
                </Link>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={buildFilterHref({
                    status: currentStatus,
                    filterChannel: "ALL",
                    q: currentQuery,
                  })}
                  className={
                    currentFilterChannel === "ALL"
                      ? "inline-flex rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold !text-white"
                      : "inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold !text-slate-700"
                  }
                >
                  Todos los canales
                </Link>
                <Link
                  href={buildFilterHref({
                    status: currentStatus,
                    filterChannel: "EMAIL",
                    q: currentQuery,
                  })}
                  className={
                    currentFilterChannel === "EMAIL"
                      ? "inline-flex rounded-full bg-sky-700 px-4 py-2 text-xs font-semibold !text-white"
                      : "inline-flex rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold text-sky-700"
                  }
                >
                  Email
                </Link>
                <Link
                  href={buildFilterHref({
                    status: currentStatus,
                    filterChannel: "WHATSAPP",
                    q: currentQuery,
                  })}
                  className={
                    currentFilterChannel === "WHATSAPP"
                      ? "inline-flex rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold !text-white"
                      : "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700"
                  }
                >
                  WhatsApp
                </Link>
                <Link
                  href={buildFilterHref({
                    status: currentStatus,
                    filterChannel: "PHONE",
                    q: currentQuery,
                  })}
                  className={
                    currentFilterChannel === "PHONE"
                      ? "inline-flex rounded-full bg-violet-700 px-4 py-2 text-xs font-semibold !text-white"
                      : "inline-flex rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-semibold text-violet-700"
                  }
                >
                  Teléfono
                </Link>
              </div>

              <p className="text-sm text-slate-500">
                Mostrando {filteredReminders.length} de {reminders.length} recordatorios.
              </p>
            </div>

            {filteredReminders.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
                <p className="text-sm text-slate-600">
                  No hay recordatorios que coincidan con ese filtro.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {filteredReminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-slate-900">
                          {reminder.invoice.customer.name}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {reminder.invoice.invoiceNumber || "Sin número"} · {formatCurrency(Number(reminder.invoice.amount))}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getReminderStatusClasses(reminder.status)}`}
                        >
                          {getReminderStatusLabel(reminder.status)}
                        </span>
                        <Link
                          href={`/recordatorios/${reminder.id}/editar`}
                          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold !text-white transition hover:bg-slate-800"
                        >
                          Editar
                        </Link>
                        <Link
                          href={`/recordatorios/${reminder.id}/eliminar`}
                          className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                        >
                          Eliminar
                        </Link>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
                      <p>
                        <span className="font-medium text-slate-900">Canal:</span>{" "}
                        {getChannelLabel(reminder.channel)}
                      </p>
                      <p>
                        <span className="font-medium text-slate-900">Programado:</span>{" "}
                        {formatDate(reminder.scheduledAt)}
                      </p>
                      <p>
                        <span className="font-medium text-slate-900">Factura:</span>{" "}
                        {getInvoiceStatusLabel(reminder.invoice.status)}
                      </p>
                      <p>
                        <span className="font-medium text-slate-900">Enviado el:</span>{" "}
                        {reminder.sentAt ? formatDate(reminder.sentAt) : "—"}
                      </p>
                    </div>

                    <p className="mt-4 text-sm text-slate-700">
                      {reminder.message || "Sin mensaje"}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <form action={updateReminderStatus}>
                        <input type="hidden" name="reminderId" value={reminder.id} />
                        <input type="hidden" name="nextStatus" value="PENDING" />
                        <button
                          type="submit"
                          className="inline-flex items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                        >
                          Marcar pendiente
                        </button>
                      </form>

                      <form action={updateReminderStatus}>
                        <input type="hidden" name="reminderId" value={reminder.id} />
                        <input type="hidden" name="nextStatus" value="SENT" />
                        <button
                          type="submit"
                          className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                        >
                          Marcar enviado
                        </button>
                      </form>

                      <form action={updateReminderStatus}>
                        <input type="hidden" name="reminderId" value={reminder.id} />
                        <input type="hidden" name="nextStatus" value="FAILED" />
                        <button
                          type="submit"
                          className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                        >
                          Marcar fallido
                        </button>
                      </form>

                      <form action={updateReminderStatus}>
                        <input type="hidden" name="reminderId" value={reminder.id} />
                        <input type="hidden" name="nextStatus" value="CANCELLED" />
                        <button
                          type="submit"
                          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold !text-slate-700 transition hover:border-slate-300 hover:!text-slate-900"
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
