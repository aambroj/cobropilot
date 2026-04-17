import Link from "next/link";

const benefits = [
  {
    title: "Control de cobros pendiente de forma simple",
    description:
      "Centraliza clientes, facturas y recordatorios para no perder seguimiento de ningún cobro.",
  },
  {
    title: "Vista clara del trabajo diario",
    description:
      "Entra al dashboard y ve rápido cuánto queda por cobrar, qué está vencido y qué avisos tienes pendientes.",
  },
  {
    title: "Pensado para avanzar rápido",
    description:
      "MVP ligero para probar el flujo real antes de meter automatizaciones o autenticación más avanzada.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 md:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
              CobroPilot
            </p>
            <p className="mt-1 text-sm text-slate-500">
              MVP para gestionar cobros pendientes
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Entrar
            </Link>
            <Link
              href="/registro"
              className="inline-flex rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 md:px-8 md:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <div className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">
                Controla mejor tus cobros
              </div>

              <h1 className="mt-6 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
                CobroPilot te ayuda a organizar clientes, facturas y recordatorios
                en un panel claro.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                Ya puedes dar de alta clientes, crear facturas, marcar estados,
                programar recordatorios y entrar con tu propia cuenta en lugar
                de depender del usuario demo.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/registro"
                  className="inline-flex rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white"
                >
                  Crear cuenta
                </Link>
                <Link
                  href="/login"
                  className="inline-flex rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700"
                >
                  Entrar al panel
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Lo que ya incluye
              </p>

              <div className="mt-6 space-y-4">
                {benefits.map((benefit) => (
                  <div
                    key={benefit.title}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <h2 className="text-lg font-bold text-slate-900">
                      {benefit.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {benefit.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">Clientes</p>
              <p className="mt-3 text-3xl font-bold text-slate-900">Alta y edición</p>
              <p className="mt-2 text-sm text-slate-600">
                Crea, edita y elimina clientes con seguridad.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">Facturas</p>
              <p className="mt-3 text-3xl font-bold text-slate-900">Seguimiento real</p>
              <p className="mt-2 text-sm text-slate-600">
                Cambia estados, edita completas y elimina con confirmación.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">Recordatorios</p>
              <p className="mt-3 text-3xl font-bold text-slate-900">Avisos listos</p>
              <p className="mt-2 text-sm text-slate-600">
                Programa, edita y borra recordatorios individuales.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
