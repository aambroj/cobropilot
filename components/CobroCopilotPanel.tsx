import Link from "next/link";
import type {
  CopilotRecommendation,
  CopilotSummary,
} from "@/lib/cobro-copilot";

type CobroCopilotPanelProps = {
  summary: CopilotSummary;
  recommendations: CopilotRecommendation[];
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function getPriorityClasses(label: string) {
  switch (label) {
    case "Muy alta":
      return "border border-rose-200 bg-rose-50 text-rose-700";
    case "Alta":
      return "border border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border border-sky-200 bg-sky-50 text-sky-700";
  }
}

function getRiskClasses(label: string) {
  switch (label) {
    case "Alto":
      return "border border-rose-200 bg-rose-50 text-rose-700";
    case "Medio":
      return "border border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  }
}

function getChannelLabel(channel: string) {
  switch (channel) {
    case "EMAIL":
      return "Email";
    case "WHATSAPP":
      return "WhatsApp";
    case "PHONE":
      return "Llamada";
    default:
      return channel;
  }
}

export default function CobroCopilotPanel({
  summary,
  recommendations,
}: CobroCopilotPanelProps) {
  return (
    <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[28px] border border-slate-800 bg-gradient-to-r from-slate-950 to-slate-900 p-5 text-white md:p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-300">
            Copilot de cobro
          </p>
          <h2 className="mt-3 text-2xl font-black md:text-3xl">
            Prioridad de hoy
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200 md:text-base">
            {summary.headline} {summary.secondary}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">
                Pendiente abierto
              </p>
              <p className="mt-2 text-2xl font-black text-white">
                {formatCurrency(summary.openAmount)}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-amber-100">
                Urgente hoy
              </p>
              <p className="mt-2 text-2xl font-black text-white">
                {formatCurrency(summary.urgentAmount)}
              </p>
            </div>

            <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-sky-100">
                Cobros en foco
              </p>
              <p className="mt-2 text-2xl font-black text-white">
                {summary.urgentCount}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 md:p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
            Qué te aporta
          </p>
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">
                Ordena a quién mover primero
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Prioriza por retraso, importe, avisos previos y riesgo de seguir
                dejando pasar el cobro.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">
                Sugiere canal y siguiente paso
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Decide si conviene email, WhatsApp o llamada y te propone la
                siguiente acción con más sentido.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">
                Te deja un mensaje base
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Ya tienes un texto para copiar, adaptar y usar como recordatorio
                o seguimiento.
              </p>
            </div>
          </div>
        </div>
      </div>

      {recommendations.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
          <p className="text-sm text-slate-600">
            Cuando existan facturas pendientes o vencidas, aquí verás a quién
            reclamar primero, por qué, qué canal conviene usar y un mensaje base
            para mover el cobro.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 xl:grid-cols-3">
          {recommendations.map((item, index) => (
            <article
              key={item.invoiceId}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Prioridad {index + 1}
                  </p>
                  <h3 className="mt-2 truncate text-xl font-bold text-slate-900">
                    {item.customerName}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {item.invoiceNumber || "Sin número"} ·{" "}
                    {formatCurrency(item.amount)}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col gap-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getPriorityClasses(item.priorityLabel)}`}
                  >
                    {item.priorityLabel}
                  </span>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getRiskClasses(item.riskLabel)}`}
                  >
                    Riesgo {item.riskLabel}
                  </span>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Siguiente acción
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {item.nextAction}
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <p className="text-sm text-slate-600">
                    Canal sugerido:{" "}
                    <span className="font-semibold text-slate-900">
                      {getChannelLabel(item.suggestedChannel)}
                    </span>
                  </p>
                  <p className="text-sm text-slate-600">
                    Retraso:{" "}
                    <span className="font-semibold text-slate-900">
                      {item.daysLate > 0 ? `${item.daysLate} días` : "aún no vencida"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Por qué priorizarla
                </p>
                <ul className="mt-2 space-y-2">
                  {item.why.map((reason) => (
                    <li key={reason} className="text-sm text-slate-700">
                      • {reason}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Mensaje sugerido
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {item.suggestedMessage}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/facturas"
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold !text-white transition hover:bg-slate-800"
                >
                  Ver facturas
                </Link>
                <Link
                  href="/recordatorios"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold !text-slate-800 transition hover:border-slate-300 hover:!text-slate-950"
                >
                  Crear recordatorio
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
