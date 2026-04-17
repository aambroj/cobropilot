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

export default async function Home() {
  const user = await requireUser();

  const [
    customerCount,
    pendingCount,
    overdueCount,
    paidCount,
    reminderPendingCount,
    collectibleInvoices,
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
      where: { userId: user.id },
      orderBy: {
        dueDate: "asc",
      },
      take: 6,
      include: {
        customer: true,
      },
    }),
    prisma.reminder.findMany({
      where: { userId: user.id },
      orderBy: {
        scheduledAt: "asc",
      },
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
        <section className="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white shadow-sm md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
            CobroPilot
          </p>
          <h1 className="mt-3 text-3xl font-bold md:text-4xl">
            Control simple de cobros pendientes
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-200 md:text-base">
            Vista inicial del MVP para controlar clientes, facturas pendientes y
            recordatorios de cobro sin complicaciones.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-slate-300">
                Cuenta actual
              </p>
              <p className="mt-2 text-lg font-semibold">
                {user.name || "Sin nombre"}
              </p>
              <p className="text-sm text-slate-200">{user.email}</p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-slate-300">
                Empresa
              </p>
              <p className="mt-2 text-lg font-semibold">
                {user.companyName || "Sin empresa"}
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-slate-300">
                Importe por cobrar
              </p>
              <p className="mt-2 text-2xl font-bold">
                {formatCurrency(collectibleAmount)}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Clientes</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {customerCount}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Facturas pendientes</p>
            <p className="mt-2 text-3xl font-bold text-amber-600">
              {pendingCount}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Facturas vencidas</p>
            <p className="mt-2 text-3xl font-bold text-rose-600">
              {overdueCount}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Facturas pagadas</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {paidCount}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Recordatorios pendientes</p>
            <p className="mt-2 text-3xl font-bold text-sky-600">
              {reminderPendingCount}
            </p>
          </div>
        </section>

        <CobroCopilotPanel
          summary={copilot.summary}
          recommendations={copilot.recommendations}
        />

        <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Próximas facturas
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Resumen de cobros y vencimientos más cercanos.
              </p>
            </div>

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
                          <p className="font-medium text-slate-900">
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
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
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

              {recentInvoices.length === 0 ? (
                <p className="py-6 text-sm text-slate-500">
                  Todavía no hay facturas.
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <h2 className="text-xl font-bold text-slate-900">
              Próximos recordatorios
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Avisos programados para reclamar o recordar pagos.
            </p>

            <div className="mt-5 space-y-4">
              {recentReminders.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No hay recordatorios todavía.
                </p>
              ) : (
                recentReminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {reminder.invoice.customer.name}
                        </p>
                        <p className="text-sm text-slate-600">
                          {getReminderChannelLabel(reminder.channel)} ·{" "}
                          {formatDate(reminder.scheduledAt)}
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                        {reminder.status}
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
