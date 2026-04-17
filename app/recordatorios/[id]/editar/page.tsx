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

  const normalizedChannel = validChannels.includes(channel as (typeof validChannels)[number])
    ? (channel as "EMAIL" | "WHATSAPP" | "PHONE")
    : "EMAIL";

  const normalizedStatus = validStatuses.includes(status as (typeof validStatuses)[number])
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
            <h1 className="text-3xl font-bold text-slate-900">No hay usuario demo</h1>
            <p className="mt-3 text-slate-600">Vuelve a recordatorios.</p>
            <Link
              href="/recordatorios"
              className="mt-6 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
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
      <div className="mx-auto max-w-5xl space-y-6">

        <section className="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
                CobroPilot
              </p>
              <h1 className="mt-3 text-3xl font-bold md:text-4xl">
                Editar recordatorio
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-200 md:text-base">
                Modifica factura, canal, fecha, estado y mensaje del recordatorio.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/recordatorios/${reminder.id}/eliminar`}
                className="inline-flex rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700"
              >
                Eliminar recordatorio
              </Link>
              <Link
                href="/recordatorios"
                className="inline-flex rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900"
              >
                Volver a recordatorios
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Cliente actual</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {reminder.invoice.customer.name}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Factura actual</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {reminder.invoice.invoiceNumber || "Sin número"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Canal</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {reminder.channel}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Estado</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {reminder.status}
              </p>
            </div>
          </div>

          <form action={updateReminder} className="space-y-4">
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
                    {invoice.customer.name} · {invoice.invoiceNumber || "Sin número"} · {Number(invoice.amount).toFixed(2)} €
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
                className="inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
              >
                Guardar cambios
              </button>

              <Link
                href="/recordatorios"
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
