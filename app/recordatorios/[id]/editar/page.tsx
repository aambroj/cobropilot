import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import PanelShell from "@/components/PanelShell";

type EditarRecordatorioPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDateTimeInput(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
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

async function updateReminder(formData: FormData) {
  "use server";

  const reminderId = String(formData.get("reminderId") ?? "").trim();

  if (!reminderId) return;

  const user = await requireUser();

  if (!user) return;

  const reminder = await prisma.reminder.findFirst({
    where: {
      id: reminderId,
      userId: user.id,
    },
  });

  if (!reminder) return;

  const invoiceId = String(formData.get("invoiceId") ?? "").trim();
  const channel = String(formData.get("channel") ?? "").trim();
  const scheduledAtRaw = String(formData.get("scheduledAt") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!invoiceId || !channel || !scheduledAtRaw || !status) return;

  const scheduledAt = new Date(scheduledAtRaw);

  if (Number.isNaN(scheduledAt.getTime())) return;

  const validChannels = ["EMAIL", "WHATSAPP", "PHONE"] as const;
  const validStatuses = ["PENDING", "SENT", "FAILED", "CANCELLED"] as const;

  const normalizedChannel = validChannels.includes(
    channel as (typeof validChannels)[number]
  )
    ? (channel as "EMAIL" | "WHATSAPP" | "PHONE")
    : "EMAIL";

  const normalizedStatus = validStatuses.includes(
    status as (typeof validStatuses)[number]
  )
    ? (status as "PENDING" | "SENT" | "FAILED" | "CANCELLED")
    : "PENDING";

  await prisma.reminder.update({
    where: {
      id: reminder.id,
    },
    data: {
      invoiceId,
      channel: normalizedChannel,
      scheduledAt,
      status: normalizedStatus,
      message: message || null,
      sentAt: normalizedStatus === "SENT" ? reminder.sentAt ?? new Date() : null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/facturas");
  revalidatePath("/recordatorios");
  revalidatePath(`/recordatorios/${reminder.id}/editar`);
  revalidatePath(`/facturas/${invoiceId}`);

  redirect("/recordatorios");
}

export default async function EditarRecordatorioPage({
  params,
}: EditarRecordatorioPageProps) {
  const { id } = await params;
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
              Antes de editar recordatorios, carga los datos demo o crea el primer
              usuario.
            </p>
            <Link
              href="/recordatorios"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold !text-white transition hover:bg-slate-800"
            >
              Volver a recordatorios
            </Link>
          </div>
        </div>
      </PanelShell>
    );
  }

  const [reminder, invoices] = await Promise.all([
    prisma.reminder.findFirst({
      where: {
        id,
        userId: user.id,
      },
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
  ]);

  if (!reminder) {
    notFound();
  }

  return (
    <PanelShell currentPath="/recordatorios">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[32px] border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
                CobroPilot
              </p>
              <h1 className="mt-3 text-3xl font-black md:text-4xl">
                Editar recordatorio
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-200 md:text-base">
                Modifica factura, canal, fecha, estado y mensaje del recordatorio
                desde una sola pantalla.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/recordatorios/${reminder.id}/eliminar`}
                className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                Eliminar recordatorio
              </Link>
              <Link
                href="/recordatorios"
                className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold !text-slate-900 transition hover:bg-slate-100"
              >
                Volver a recordatorios
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
                  {reminder.invoice.customer.name}
                </p>
                <p>
                  <span className="font-medium text-slate-900">Factura:</span>{" "}
                  {reminder.invoice.invoiceNumber || "Sin número"}
                </p>
                <p>
                  <span className="font-medium text-slate-900">Importe:</span>{" "}
                  {formatCurrency(Number(reminder.invoice.amount))}
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
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <h2 className="text-xl font-bold text-slate-900">Notas</h2>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm leading-6 text-slate-700">
                  Puedes mover este recordatorio a otra factura del mismo negocio,
                  cambiar el canal, la fecha prevista o actualizar el mensaje sin
                  salir del panel.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <h2 className="text-xl font-bold text-slate-900">
              Datos del recordatorio
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Modifica lo que necesites y guarda los cambios.
            </p>

            <form action={updateReminder} className="mt-6 space-y-4">
              <input type="hidden" name="reminderId" value={reminder.id} />

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Factura
                </label>
                <select
                  name="invoiceId"
                  required
                  defaultValue={reminder.invoiceId}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                >
                  {invoices.map((invoice) => (
                    <option key={invoice.id} value={invoice.id}>
                      {invoice.customer.name} · {invoice.invoiceNumber || "Sin número"} ·{" "}
                      {formatCurrency(Number(invoice.amount))}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Canal
                  </label>
                  <select
                    name="channel"
                    defaultValue={reminder.channel}
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
                    defaultValue={formatDateTimeInput(reminder.scheduledAt)}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Estado
                  </label>
                  <select
                    name="status"
                    defaultValue={reminder.status}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                  >
                    <option value="PENDING">Pendiente</option>
                    <option value="SENT">Enviado</option>
                    <option value="FAILED">Fallido</option>
                    <option value="CANCELLED">Cancelado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Mensaje
                </label>
                <textarea
                  name="message"
                  rows={5}
                  defaultValue={reminder.message ?? ""}
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
                  href="/recordatorios"
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
