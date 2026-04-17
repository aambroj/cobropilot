import Link from "next/link";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import PanelShell from "@/components/PanelShell";

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

export default async function RecordatoriosPage() {
  const user = await requireUser();

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
              className="mt-6 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
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
                className="inline-flex rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm"
              >
                Ver facturas
              </Link>
              <Link
                href="/clientes"
                className="inline-flex rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm"
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

            {invoices.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
                <p className="text-sm text-slate-600">
                  Primero necesitas al menos una factura para poder crear recordatorios.
                </p>
                <Link
                  href="/facturas"
                  className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
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
                    defaultValue=""
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
                      defaultValue="EMAIL"
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
                    rows={4}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900"
                    placeholder="Ej. Hola, te escribo para recordarte que la factura sigue pendiente de pago."
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
                >
                  Guardar recordatorio
                </button>
              </form>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Recordatorios guardados
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Aquí puedes cambiar el estado, editar o eliminar.
                </p>
              </div>
            </div>

            {reminders.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
                <p className="text-sm text-slate-600">
                  Todavía no hay recordatorios. Crea el primero desde el formulario.
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
                          className="inline-flex rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                        >
                          Editar
                        </Link>
                        <Link
                          href={`/recordatorios/${reminder.id}/eliminar`}
                          className="inline-flex rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
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
                          className="inline-flex rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700"
                        >
                          Marcar pendiente
                        </button>
                      </form>

                      <form action={updateReminderStatus}>
                        <input type="hidden" name="reminderId" value={reminder.id} />
                        <input type="hidden" name="nextStatus" value="SENT" />
                        <button
                          type="submit"
                          className="inline-flex rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"
                        >
                          Marcar enviado
                        </button>
                      </form>

                      <form action={updateReminderStatus}>
                        <input type="hidden" name="reminderId" value={reminder.id} />
                        <input type="hidden" name="nextStatus" value="FAILED" />
                        <button
                          type="submit"
                          className="inline-flex rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
                        >
                          Marcar fallido
                        </button>
                      </form>

                      <form action={updateReminderStatus}>
                        <input type="hidden" name="reminderId" value={reminder.id} />
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
