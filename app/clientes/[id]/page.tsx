import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import PanelShell from "@/components/PanelShell";

type ClienteDetallePageProps = {
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

export default async function ClienteDetallePage({
  params,
}: ClienteDetallePageProps) {
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
              Antes de entrar en la ficha del cliente, carga los datos demo o crea el primer usuario.
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
  });

  if (!customer) {
    notFound();
  }

  const [invoices, reminders] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        userId: user.id,
        customerId: customer.id,
      },
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
      include: {
        _count: {
          select: {
            reminders: true,
          },
        },
      },
    }),
    prisma.reminder.findMany({
      where: {
        userId: user.id,
        invoice: {
          customerId: customer.id,
        },
      },
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
      include: {
        invoice: true,
      },
    }),
  ]);

  const pendingInvoices = invoices.filter((invoice) => invoice.status === "PENDING").length;
  const overdueInvoices = invoices.filter((invoice) => invoice.status === "OVERDUE").length;
  const collectibleAmount = invoices
    .filter((invoice) => invoice.status === "PENDING" || invoice.status === "OVERDUE")
    .reduce((acc, invoice) => acc + Number(invoice.amount), 0);

  return (
    <PanelShell currentPath="/clientes">
      <div className="mx-auto max-w-7xl space-y-6">

        <section className="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
                CobroPilot
              </p>
              <h1 className="mt-3 text-3xl font-bold md:text-4xl">
                {customer.name}
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-200 md:text-base">
                Ficha simple del cliente con sus datos, facturas y recordatorios asociados.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/clientes/${customer.id}/editar`}
                className="inline-flex rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900"
              >
                Editar cliente
              </Link>
              {invoices.length === 0 ? (
                <Link
                  href={`/clientes/${customer.id}/eliminar`}
                  className="inline-flex rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700"
                >
                  Eliminar cliente
                </Link>
              ) : null}
              <Link
                href="/clientes"
                className="inline-flex rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm"
              >
                Volver a clientes
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Facturas</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{invoices.length}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Pendientes</p>
            <p className="mt-2 text-3xl font-bold text-amber-600">{pendingInvoices}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Vencidas</p>
            <p className="mt-2 text-3xl font-bold text-rose-600">{overdueInvoices}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Importe por cobrar</p>
            <p className="mt-2 text-3xl font-bold text-sky-700">
              {formatCurrency(collectibleAmount)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Recordatorios: {reminders.length}
            </p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <h2 className="text-xl font-bold text-slate-900">Datos del cliente</h2>
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
                  <span className="font-medium text-slate-900">Creado:</span>{" "}
                  {formatDateOnly(customer.createdAt)}
                </p>
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-900">Notas</p>
                <p className="mt-2 text-sm text-slate-700">
                  {customer.notes || "Sin notas para este cliente."}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <h2 className="text-xl font-bold text-slate-900">Accesos rápidos</h2>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={`/clientes/${customer.id}/editar`}
                  className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  Editar cliente
                </Link>
                {invoices.length === 0 ? (
                  <Link
                    href={`/clientes/${customer.id}/eliminar`}
                    className="inline-flex rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700"
                  >
                    Eliminar cliente
                  </Link>
                ) : null}
                <Link
                  href="/facturas"
                  className="inline-flex rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Ir a facturas
                </Link>
                <Link
                  href="/recordatorios"
                  className="inline-flex rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Ir a recordatorios
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Facturas del cliente</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Histórico simple de cobros asociados.
                  </p>
                </div>
              </div>

              {invoices.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
                  <p className="text-sm text-slate-600">
                    Este cliente todavía no tiene facturas.
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
                            {invoice.invoiceNumber || "Sin número"}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            {invoice.concept}
                          </p>
                        </div>

                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getInvoiceStatusClasses(invoice.status)}`}
                        >
                          {getInvoiceStatusLabel(invoice.status)}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
                        <p>
                          <span className="font-medium text-slate-900">Importe:</span>{" "}
                          {formatCurrency(Number(invoice.amount))}
                        </p>
                        <p>
                          <span className="font-medium text-slate-900">Vence:</span>{" "}
                          {formatDateOnly(invoice.dueDate)}
                        </p>
                        <p>
                          <span className="font-medium text-slate-900">Recordatorios:</span>{" "}
                          {invoice._count.reminders}
                        </p>
                        <p>
                          <span className="font-medium text-slate-900">Pagada el:</span>{" "}
                          {invoice.paidAt ? formatDateOnly(invoice.paidAt) : "—"}
                        </p>
                      </div>

                      {invoice.notes ? (
                        <p className="mt-4 text-sm text-slate-700">{invoice.notes}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Recordatorios del cliente</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Avisos asociados a sus facturas.
                  </p>
                </div>
              </div>

              {reminders.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
                  <p className="text-sm text-slate-600">
                    Este cliente todavía no tiene recordatorios.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {reminders.map((reminder) => (
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
                            {reminder.invoice.invoiceNumber || "Sin número"} · {formatCurrency(Number(reminder.invoice.amount))}
                          </p>
                        </div>

                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getReminderStatusClasses(reminder.status)}`}
                        >
                          {getReminderStatusLabel(reminder.status)}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
                        <p>
                          <span className="font-medium text-slate-900">Programado:</span>{" "}
                          {formatDate(reminder.scheduledAt)}
                        </p>
                        <p>
                          <span className="font-medium text-slate-900">Enviado el:</span>{" "}
                          {reminder.sentAt ? formatDate(reminder.sentAt) : "—"}
                        </p>
                        <p>
                          <span className="font-medium text-slate-900">Estado factura:</span>{" "}
                          {getInvoiceStatusLabel(reminder.invoice.status)}
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
