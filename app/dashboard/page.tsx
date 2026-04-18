import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import PanelShell from "@/components/PanelShell";
import CobroCopilotPanel from "@/components/CobroCopilotPanel";
import { buildCobroCopilot } from "@/lib/cobro-copilot";

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

function getReminderChannelLabel(channel: string) {
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

export default async function DashboardPage() {
  const user = await requireUser();

  const [
    customerCount,
    pendingCount,
    overdueCount,
    paidCount,
    reminderPendingCount,
    collectibleInvoices,
    overdueInvoices,
    recentInvoices,
    recentReminders,
    copilotInvoices,
  ] = await Promise.all([
    prisma.customer.count({
      where: { userId: user.id },
    }),
    prisma.invoice.count({
      where: {
        userId: user.id,
        status: "PENDING",
      },
    }),
    prisma.invoice.count({
      where: {
        userId: user.id,
        status: "OVERDUE",
      },
    }),
    prisma.invoice.count({
      where: {
        userId: user.id,
        status: "PAID",
      },
    }),
    prisma.reminder.count({
      where: {
        userId: user.id,
        status: "PENDING",
      },
    }),
    prisma.invoice.findMany({
      where: {
        userId: user.id,
        status: {
          in: ["PENDING", "OVERDUE"],
        },
      },
      select: {
        amount: true,
      },
    }),
    prisma.invoice.findMany({
      where: {
        userId: user.id,
        status: "OVERDUE",
      },
      select: {
        amount: true,
      },
    }),
    prisma.invoice.findMany({
      where: { userId: user.id },
      orderBy: [
        {
          dueDate: "asc",
        },
        {
          createdAt: "desc",
        },
      ],
      take: 6,
      include: {
        customer: true,
      },
    }),
    prisma.reminder.findMany({
      where: { userId: user.id },
      orderBy: [
        {
          scheduledAt: "asc",
        },
      ],
      take: 6,
      include: {
        invoice: {
          include: {
            customer: true,
          },
        },
      },
    }),
    prisma.invoice.findMany({
      where: {
        userId: user.id,
        status: {
          in: ["PENDING", "OVERDUE"],
        },
      },
      include: {
        customer: true,
        reminders: {
          select: {
            id: true,
            channel: true,
            status: true,
            createdAt: true,
            sentAt: true,
            message: true,
          },
        },
      },
      orderBy: [
        {
          dueDate: "asc",
        },
      ],
    }),
  ]);

  const collectibleAmount = collectibleInvoices.reduce((acc, invoice) => {
    return acc + Number(invoice.amount);
  }, 0);

  const overdueAmount = overdueInvoices.reduce((acc, invoice) => {
    return acc + Number(invoice.amount);
  }, 0);

  const copilot = buildCobroCopilot(
    copilotInvoices.map((invoice) => ({
      id: invoice.id,
      concept: invoice.concept,
      invoiceNumber: invoice.invoiceNumber,
      amount: Number(invoice.amount),
      dueDate: invoice.dueDate,
      status: invoice.status as "PENDING" | "OVERDUE",
      customer: {
        name: invoice.customer.name,
      },
      reminders: invoice.reminders.map((reminder) => ({
        id: reminder.id,
        channel: reminder.channel,
        status: reminder.status,
        createdAt: reminder.createdAt,
        sentAt: reminder.sentAt,
        message: reminder.message,
      })),
    }))
  );

  return (
    <PanelShell currentPath="/dashboard">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[32px] border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm md:p-8">
          <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-300">
                CobroPilot
              </p>
              <h1 className="mt-3 text-3xl font-black md:text-5xl md:leading-[1.05]">
                Control más claro de lo que tienes por cobrar hoy.
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-200 md:text-base md:leading-8">
                Revisa importes abiertos, facturas vencidas, recordatorios pendientes y las
                prioridades que más conviene mover desde el Copilot.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/facturas"
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold !text-slate-900 transition hover:bg-slate-100"
                >
                  Ver facturas
                </Link>
                <Link
                  href="/recordatorios"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold !text-white transition hover:bg-white/10"
                >
                  Ver recordatorios
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                  Cuenta actual
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {user.name || "Sin nombre"}
                </p>
                <p className="text-sm text-slate-200">{user.email}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                  Empresa
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {user.companyName || "Sin empresa"}
                </p>
              </div>

              <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 p-4 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-sky-100">
                  Importe abierto
                </p>
                <p className="mt-2 text-3xl font-black text-white">
                  {formatCurrency(collectibleAmount)}
                </p>
                <p className="mt-1 text-xs text-sky-100">
                  Pendiente + vencido
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Clientes</p>
            <p className="mt-2 text-3xl font-black text-slate-950">
              {customerCount}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Base activa de clientes
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Pendientes</p>
            <p className="mt-2 text-3xl font-black text-amber-600">
              {pendingCount}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Facturas aún en plazo
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Vencidas</p>
            <p className="mt-2 text-3xl font-black text-rose-600">
              {overdueCount}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {formatCurrency(overdueAmount)} en riesgo
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Pagadas</p>
            <p className="mt-2 text-3xl font-black text-emerald-600">
              {paidCount}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Ya cerradas correctamente
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Recordatorios pendientes</p>
            <p className="mt-2 text-3xl font-black text-sky-600">
              {reminderPendingCount}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Avisos aún por mover
            </p>
          </div>
        </section>

        <CobroCopilotPanel
          summary={copilot.summary}
          recommendations={copilot.recommendations}
        />

        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Próximas facturas
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Lo siguiente que vence o requiere seguimiento.
                </p>
              </div>

              <Link
                href="/facturas"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold !text-slate-800 transition hover:border-slate-300 hover:!text-slate-950"
              >
                Ir a facturas
              </Link>
            </div>

            {recentInvoices.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
                <p className="text-sm text-slate-600">
                  Todavía no hay facturas registradas.
                </p>
              </div>
            ) : (
              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-200 text-slate-500">
                    <tr>
                      <th className="pb-3 pr-4 font-medium">Cliente</th>
                      <th className="pb-3 pr-4 font-medium">Concepto</th>
                      <th className="pb-3 pr-4 font-medium">Vence</th>
                      <th className="pb-3 pr-4 font-medium">Estado</th>
                      <th className="pb-3 text-right font-medium">Importe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentInvoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b border-slate-100">
                        <td className="py-3 pr-4">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {invoice.customer.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {invoice.invoiceNumber || "Sin número"}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-slate-700">
                          {invoice.concept}
                        </td>
                        <td className="py-3 pr-4 text-slate-700">
                          {formatDate(invoice.dueDate)}
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getInvoiceStatusClasses(invoice.status)}`}
                          >
                            {getInvoiceStatusLabel(invoice.status)}
                          </span>
                        </td>
                        <td className="py-3 text-right font-semibold text-slate-900">
                          {formatCurrency(Number(invoice.amount))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Próximos recordatorios
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Avisos programados para reclamar o recordar pagos.
                </p>
              </div>

              <Link
                href="/recordatorios"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold !text-slate-800 transition hover:border-slate-300 hover:!text-slate-950"
              >
                Ir a recordatorios
              </Link>
            </div>

            <div className="mt-5 space-y-4">
              {recentReminders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
                  <p className="text-sm text-slate-600">
                    No hay recordatorios todavía.
                  </p>
                </div>
              ) : (
                recentReminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">
                          {reminder.invoice.customer.name}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {getReminderChannelLabel(reminder.channel)} ·{" "}
                          {formatDate(reminder.scheduledAt)}
                        </p>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getReminderStatusClasses(reminder.status)}`}
                      >
                        {getReminderStatusLabel(reminder.status)}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-slate-700">
                      {reminder.message || "Sin mensaje"}
                    </p>

                    <p className="mt-3 text-xs text-slate-500">
                      Factura: {reminder.invoice.invoiceNumber || "Sin número"} ·{" "}
                      {formatCurrency(Number(reminder.invoice.amount))}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </PanelShell>
  );
}
