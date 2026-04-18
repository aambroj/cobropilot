import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import PanelShell from "@/components/PanelShell";

type EliminarRecordatorioPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

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

async function deleteReminder(formData: FormData) {
  "use server";

  const reminderId = String(formData.get("reminderId") ?? "").trim();
  const confirmation = String(formData.get("confirmation") ?? "").trim();

  if (!reminderId) return;

  const user = await requireUser();

  if (!user) return;

  const reminder = await prisma.reminder.findFirst({
    where: {
      id: reminderId,
      userId: user.id,
    },
    include: {
      invoice: true,
    },
  });

  if (!reminder) return;

  if (confirmation !== "ELIMINAR RECORDATORIO") {
    redirect(`/recordatorios/${reminder.id}/eliminar?error=confirm`);
  }

  await prisma.reminder.delete({
    where: {
      id: reminder.id,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/facturas");
  revalidatePath("/recordatorios");
  revalidatePath(`/facturas/${reminder.invoiceId}`);

  redirect("/recordatorios");
}

export default async function EliminarRecordatorioPage({
  params,
  searchParams,
}: EliminarRecordatorioPageProps) {
  const { id } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const error = resolvedSearchParams.error ?? "";

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
              Antes de eliminar recordatorios, carga los datos demo o crea el
              primer usuario.
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

  const reminder = await prisma.reminder.findFirst({
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
  });

  if (!reminder) {
    notFound();
  }

  return (
    <PanelShell currentPath="/recordatorios">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[32px] border border-rose-700 bg-gradient-to-r from-rose-800 via-rose-700 to-rose-600 p-6 text-white shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-100">
                CobroPilot
              </p>
              <h1 className="mt-3 text-3xl font-black md:text-4xl">
                Eliminar recordatorio
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-rose-50 md:text-base">
                Acción delicada. Vas a borrar un recordatorio individual de esta
                factura.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/recordatorios/${reminder.id}/editar`}
                className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold !text-rose-700 transition hover:bg-rose-50"
              >
                Volver a editar
              </Link>
              <Link
                href="/recordatorios"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold !text-white backdrop-blur-sm transition hover:bg-white/15"
              >
                Lista de recordatorios
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.86fr_1.14fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <h2 className="text-xl font-bold text-slate-900">
                Comprobación previa
              </h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Cliente</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {reminder.invoice.customer.name}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Factura</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {reminder.invoice.invoiceNumber || "Sin número"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Canal</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {getChannelLabel(reminder.channel)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Estado</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {getReminderStatusLabel(reminder.status)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <h2 className="text-xl font-bold text-slate-900">Qué ocurrirá</h2>

              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                <p className="text-sm font-semibold text-rose-800">
                  Este recordatorio se puede eliminar.
                </p>
                <p className="mt-2 text-sm leading-6 text-rose-700">
                  Si confirmas, desaparecerá del panel y dejará de contar dentro
                  del seguimiento de esta factura.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <h2 className="text-xl font-bold text-slate-900">
              Confirmación final
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Para confirmar, escribe exactamente{" "}
              <span className="font-semibold">ELIMINAR RECORDATORIO</span>.
            </p>

            {error === "confirm" ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                La confirmación no coincide. Escribe exactamente ELIMINAR
                RECORDATORIO.
              </div>
            ) : null}

            <form action={deleteReminder} className="mt-6 space-y-4">
              <input type="hidden" name="reminderId" value={reminder.id} />

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Confirmación
                </label>
                <input
                  name="confirmation"
                  placeholder="Escribe ELIMINAR RECORDATORIO"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900"
                />
                <p className="mt-2 text-xs text-slate-500">
                  También puedes pulsar Enter después de escribir la
                  confirmación.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold !text-white transition hover:bg-rose-700"
                >
                  Sí, eliminar recordatorio definitivamente
                </button>

                <Link
                  href={`/recordatorios/${reminder.id}/editar`}
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
