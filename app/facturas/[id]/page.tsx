import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import PanelShell from "@/components/PanelShell";
import InvoiceMessageGenerator from "@/components/InvoiceMessageGenerator";

type FacturaDetallePageProps = {
  params: Promise<{
    id: string;
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
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function formatDateOnly(value: Date) {
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
      return "border border-amber-200 bg-amber-50 text-amber-700";
    case "SENT":
      return "border border-emerald-200 bg-emerald-50 text-emerald-700";
    case "FAILED":
      return "border border-rose-200 bg-rose-50 text-rose-700";
    case "CANCELLED":
      return "border border-slate-200 bg-slate-100 text-slate-700";
    default:
      return "border border-slate-200 bg-slate-100 text-slate-700";
  }
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

function buildCollectionMessages(params: {
  invoiceId: string;
  customerName: string;
  concept: string;
  invoiceNumber: string | null;
  amount: number;
  dueDate: Date;
  status: string;
}) {
  const dueDateText = formatDateOnly(params.dueDate);
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

export default async function FacturaDetallePage({
  params,
}: FacturaDetallePageProps) {
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
              Antes de entrar en la ficha de factura, carga los datos demo o crea
              el primer usuario.
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

  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      userId: user.id,
    },
    include: {
      customer: true,
      reminders: {
        orderBy: [
          {
            scheduledAt: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
      },
    },
  });

  if (!invoice) {
    notFound();
  }

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
    <PanelShell currentPath="/facturas">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[32px] border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
                CobroPilot
              </p>
              <h1 className="mt-3 text-3xl font-black md:text-4xl">
                {invoice.invoiceNumber || "Factura sin número"}
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-200 md:text-base">
                Ficha completa de factura con cliente, estado, recordatorios y
                mensajes de cobro listos para usar.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/facturas/${invoice.id}/editar`}
                className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold !text-slate-900 transition hover:bg-slate-100"
              >
                Editar factura
              </Link>
              <Link
                href={`/facturas/${invoice.id}/eliminar`}
                className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                Eliminar factura
              </Link>
              <Link
                href="/facturas"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold !text-white backdrop-blur-sm transition hover:bg-white/15"
              >
                Volver a facturas
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Cliente</p>
            <p className="mt-2 text-xl font-black text-slate-900">
              {invoice.customer.name}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Estado</p>
            <div className="mt-2">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getInvoiceStatusClasses(invoice.status)}`}
              >
                {getInvoiceStatusLabel(invoice.status)}
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Importe</p>
            <p className="mt-2 text-3xl font-black text-sky-700">
              {formatCurrency(Number(invoice.amount))}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Recordatorios</p>
            <p className="mt-2 text-3xl font-black text-slate-900">
              {invoice.reminders.length}
            </p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <h2 className="text-xl font-bold text-slate-900">
                Datos de la factura
              </h2>

              <div className="mt-5 grid gap-4 text-sm text-slate-700">
                <p>
                  <span className="font-medium text-slate-900">Cliente:</span>{" "}
                  <Link
                    href={`/clientes/${invoice.customer.id}`}
                    className="font-semibold text-sky-700"
                  >
                    {invoice.customer.name}
                  </Link>
                </p>
                <p>
                  <span className="font-medium text-slate-900">Empresa:</span>{" "}
                  {invoice.customer.company || "—"}
                </p>
                <p>
                  <span className="font-medium text-slate-900">Concepto:</span>{" "}
                  {invoice.concept}
                </p>
                <p>
                  <span className="font-medium text-slate-900">Número:</span>{" "}
                  {invoice.invoiceNumber || "Sin número"}
                </p>
                <p>
                  <span className="font-medium text-slate-900">Vencimiento:</span>{" "}
                  {formatDateOnly(invoice.dueDate)}
                </p>
                <p>
                  <span className="font-medium text-slate-900">Pagada el:</span>{" "}
                  {invoice.paidAt ? formatDateOnly(invoice.paidAt) : "—"}
                </p>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Notas</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {invoice.notes || "Sin notas para esta factura."}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <h2 className="text-xl font-bold text-slate-900">
                Accesos rápidos
              </h2>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={`/facturas/${invoice.id}/editar`}
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold !text-white transition hover:bg-slate-800"
                >
                  Editar factura
                </Link>
                <Link
                  href={`/clientes/${invoice.customer.id}`}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold !text-slate-700 transition hover:border-slate-300 hover:!text-slate-900"
                >
                  Ver cliente
                </Link>
                <Link
                  href="/recordatorios"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold !text-slate-700 transition hover:border-slate-300 hover:!text-slate-900"
                >
                  Ir a recordatorios
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {canGenerateMessages ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Mensajes de cobro
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Usa un tono amable, firme o muy directo según el momento del
                    cobro.
                  </p>
                </div>

                <InvoiceMessageGenerator options={messages} />
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                <h2 className="text-xl font-bold text-slate-900">
                  Mensajes de cobro
                </h2>
                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
                  <p className="text-sm text-slate-600">
                    Los mensajes de cobro solo se muestran en facturas
                    pendientes o vencidas.
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Recordatorios de esta factura
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Avisos programados o enviados para este cobro.
                  </p>
                </div>
              </div>

              {invoice.reminders.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
                  <p className="text-sm text-slate-600">
                    Esta factura todavía no tiene recordatorios.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {invoice.reminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-lg font-semibold text-slate-900">
                            {getChannelLabel(reminder.channel)}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            Programado para {formatDate(reminder.scheduledAt)}
                          </p>
                        </div>

                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getReminderStatusClasses(reminder.status)}`}
                        >
                          {getReminderStatusLabel(reminder.status)}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-3">
                        <p>
                          <span className="font-medium text-slate-900">Enviado el:</span>{" "}
                          {reminder.sentAt ? formatDate(reminder.sentAt) : "—"}
                        </p>
                        <p>
                          <span className="font-medium text-slate-900">Canal:</span>{" "}
                          {getChannelLabel(reminder.channel)}
                        </p>
                        <p>
                          <span className="font-medium text-slate-900">Estado:</span>{" "}
                          {getReminderStatusLabel(reminder.status)}
                        </p>
                      </div>

                      <p className="mt-4 text-sm text-slate-700">
                        {reminder.message || "Sin mensaje"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </PanelShell>
  );
}
