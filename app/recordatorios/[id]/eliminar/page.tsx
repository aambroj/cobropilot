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

async function deleteReminder(formData: FormData) {
  "use server";

  const reminderId = String(formData.get("reminderId") ?? "").trim();
  const confirmation = String(formData.get("confirmation") ?? "").trim();

  if (!reminderId) return;

  const user = await prisma.user.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!user) return;

  const reminder = await prisma.reminder.findFirst({
    where: {
      id: reminderId,
      userId: user.id,
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

  redirect("/recordatorios");
}

export default async function EliminarRecordatorioPage({
  params,
  searchParams,
}: EliminarRecordatorioPageProps) {
  const { id } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const error = resolvedSearchParams.error ?? "";

  const user = await prisma.user.findFirst({
    orderBy: { createdAt: "desc" },
  });

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
      <div className="mx-auto max-w-5xl space-y-6">

        <section
          className="rounded-3xl p-6 shadow-sm md:p-8"
          style={{
            background: "linear-gradient(90deg, #be123c 0%, #e11d48 100%)",
            color: "#ffffff",
          }}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p
                className="text-sm font-semibold uppercase tracking-[0.2em]"
                style={{ color: "#ffe4e6" }}
              >
                CobroPilot
              </p>
              <h1 className="mt-3 text-3xl font-bold md:text-4xl">
                Eliminar recordatorio
              </h1>
              <p
                className="mt-3 max-w-2xl text-sm md:text-base"
                style={{ color: "#fff1f2" }}
              >
                Acción delicada. Vas a borrar un recordatorio individual de esta factura.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/recordatorios/${reminder.id}/editar`}
                className="inline-flex rounded-xl px-4 py-2 text-sm font-semibold"
                style={{ backgroundColor: "#ffffff", color: "#be123c" }}
              >
                Volver a editar
              </Link>
              <Link
                href="/recordatorios"
                className="inline-flex rounded-xl px-4 py-2 text-sm font-semibold"
                style={{
                  backgroundColor: "rgba(255,255,255,0.12)",
                  color: "#ffffff",
                  border: "1px solid rgba(255,255,255,0.28)",
                }}
              >
                Lista de recordatorios
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <h2 className="text-xl font-bold text-slate-900">Comprobación previa</h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5">
            <p className="text-sm font-semibold text-rose-800">
              Este recordatorio se puede eliminar.
            </p>
            <p className="mt-2 text-sm text-rose-700">
              Para confirmar, escribe exactamente <span className="font-bold">ELIMINAR RECORDATORIO</span>.
            </p>
          </div>

          {error === "confirm" ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              La confirmación no coincide. Escribe exactamente ELIMINAR RECORDATORIO.
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
                También puedes pulsar Enter después de escribir ELIMINAR RECORDATORIO.
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "14px 20px",
                  borderRadius: "16px",
                  border: "1px solid #be123c",
                  backgroundColor: "#e11d48",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Sí, eliminar recordatorio definitivamente
              </button>

              <Link
                href={`/recordatorios/${reminder.id}/editar`}
                className="flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700"
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
