import Link from "next/link";
import type { CopilotRecommendation, CopilotSummary } from "@/lib/cobro-copilot";

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
      return "bg-rose-50 text-rose-700 border border-rose-200";
    case "Alta":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    default:
      return "bg-sky-50 text-sky-700 border border-sky-200";
  }
}

function getRiskClasses(label: string) {
  switch (label) {
    case "Alto":
      return "bg-rose-50 text-rose-700 border border-rose-200";
    case "Medio":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    default:
      return "bg-emerald-50 text-emerald-700 border border-emerald-200";
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
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
            Copilot de cobro
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            Prioridad de hoy
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            {summary.headline} {summary.secondary}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Pendiente abierto
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {formatCurrency(summary.openAmount)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Urgente hoy
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {formatCurrency(summary.urgentAmount)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {summary.urgentCount} cobros en foco
            </p>
          </div>
        </div>
      </div>

      {recommendations.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
          <p className="text-sm text-slate-600">
            Cuando existan facturas pendientes o vencidas, aquí verás a quién reclamar primero, por qué y un mensaje sugerido listo para copiar.
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
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Prioridad {index + 1}
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-slate-900">
                    {item.customerName}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {item.invoiceNumber || "Sin número"} · {formatCurrency(item.amount)}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
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

              <div className="mt-4 rounded-2xl bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Siguiente acción
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {item.nextAction}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Canal sugerido: <span className="font-semibold text-slate-900">{getChannelLabel(item.suggestedChannel)}</span>
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Retraso: <span className="font-semibold text-slate-900">{item.daysLate > 0 ? `${item.daysLate} días` : "aún no vencida"}</span>
                </p>
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
                  className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  Ver facturas
                </Link>
                <Link
                  href="/recordatorios"
                  className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
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
