import Link from "next/link";

const coreBenefits = [
  {
    eyebrow: "Control diario",
    title: "Ve rápido qué está pendiente, qué vence y qué debes mover hoy.",
    description:
      "Ten en un mismo panel clientes, facturas y recordatorios para no perder tiempo saltando entre notas, correos y mensajes.",
  },
  {
    eyebrow: "Seguimiento real",
    title: "Haz seguimiento de cobros sin llevarlo todo en la cabeza.",
    description:
      "Marca estados, revisa lo vencido y mantén un proceso más claro para cobrar antes y con menos fricción.",
  },
  {
    eyebrow: "Trabajo simple",
    title: "Empieza en minutos con una herramienta ligera y directa.",
    description:
      "CobroPilot está pensado para trabajar rápido: alta de clientes, creación de facturas y avisos listos sin complicarte con un sistema pesado.",
  },
];

const featureCards = [
  {
    label: "Clientes",
    title: "Base ordenada",
    description:
      "Guarda cada cliente con sus datos y mantén el seguimiento más limpio desde el primer momento.",
  },
  {
    label: "Facturas",
    title: "Estado claro",
    description:
      "Controla si una factura está pendiente, vencida o resuelta sin perder visibilidad del trabajo real.",
  },
  {
    label: "Recordatorios",
    title: "Avisos útiles",
    description:
      "Programa recordatorios concretos para no dejar cobros olvidados ni llamadas sin hacer.",
  },
];

const workflow = [
  {
    step: "01",
    title: "Das de alta al cliente",
    description:
      "Creas la ficha y centralizas sus datos para empezar a trabajar con orden.",
  },
  {
    step: "02",
    title: "Registras la factura",
    description:
      "Anotas importe, vencimiento y estado para tener el cobro localizado desde el principio.",
  },
  {
    step: "03",
    title: "Sigues el cobro sin perderlo",
    description:
      "Usas recordatorios y panel de control para decidir qué mover hoy y qué facturas necesitan atención.",
  },
];

const primaryButtonClass =
  "inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3.5 text-sm font-semibold !text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300";

const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold !text-slate-800 transition hover:border-slate-300 hover:!text-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-200";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 md:px-8">
          <Link href="/" className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
              CobroPilot
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Control simple de facturas pendientes
            </p>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/login" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold !text-slate-800 transition hover:border-slate-300 hover:!text-slate-950">
              Entrar
            </Link>
            <Link href="/registro" className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold !text-white transition hover:bg-slate-800">
              Crear cuenta
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 pb-12 pt-10 md:px-8 md:pb-20 md:pt-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">
                Menos olvidos. Más control. Mejor seguimiento.
              </div>

              <h1 className="mt-6 text-4xl font-black leading-tight text-slate-950 md:text-6xl md:leading-[1.05]">
                Controla facturas pendientes y cobra antes sin perder el hilo.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                CobroPilot te ayuda a organizar clientes, facturas y
                recordatorios en un panel claro para saber qué está pendiente,
                qué vence pronto y qué cobros deberías mover hoy.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/registro" className={primaryButtonClass}>
                  Empezar ahora
                </Link>
                <Link href="/login" className={secondaryButtonClass}>
                  Entrar al panel
                </Link>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">
                    Clientes bien ordenados
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Todo más localizado desde el inicio.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">
                    Facturas bajo control
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Estados y seguimiento más claros.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">
                    Recordatorios listos
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Menos cobros olvidados.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 md:p-7">
              <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-5 text-white md:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">
                      Vista rápida
                    </p>
                    <p className="mt-2 text-xl font-bold text-white">Panel de cobros</p>
                  </div>
                  <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
                    Hoy
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-300">
                      Pendiente
                    </p>
                    <p className="mt-2 text-2xl font-black text-white">12</p>
                    <p className="mt-1 text-xs text-slate-300">
                      Facturas por seguir
                    </p>
                  </div>
                  <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-amber-100">
                      Vence pronto
                    </p>
                    <p className="mt-2 text-2xl font-black text-white">4</p>
                    <p className="mt-1 text-xs text-amber-100">
                      Revisar esta semana
                    </p>
                  </div>
                  <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-rose-100">
                      Vencida
                    </p>
                    <p className="mt-2 text-2xl font-black text-white">3</p>
                    <p className="mt-1 text-xs text-rose-100">
                      Requieren acción
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Próximo recordatorio
                      </p>
                      <p className="mt-1 text-sm text-slate-300">
                        Llamar a Instalaciones Rivera por factura FR-2026-018.
                      </p>
                    </div>
                    <span className="rounded-full bg-sky-400/15 px-3 py-1 text-xs font-semibold text-sky-200">
                      10:30
                    </span>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-white/10 bg-white p-4 text-slate-900">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">
                        Cliente con más importe pendiente
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Reformas Costa · 2 facturas pendientes
                      </p>
                    </div>
                    <p className="text-lg font-black">1.840 €</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    Seguimiento más visible
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Lo importante arriba: vencimientos, próximos avisos y facturas
                    que requieren movimiento.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    Hecho para trabajar rápido
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Menos vueltas, menos desorden y una vista mucho más práctica
                    del cobro pendiente.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 grid gap-4 md:grid-cols-3">
            {featureCards.map((card) => (
              <div
                key={card.title}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950">
                  {card.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-4 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
              Por qué encaja bien
            </p>
            <h2 className="mt-4 text-3xl font-black leading-tight text-slate-950 md:text-4xl">
              Una forma más clara de llevar cobros sin depender de memoria,
              papeles o mensajes sueltos.
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              La idea no es meter más complejidad, sino darte una base simple
              para saber siempre qué has emitido, qué queda pendiente y qué
              cobros requieren seguimiento.
            </p>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {coreBenefits.map((benefit) => (
              <div
                key={benefit.title}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-6"
              >
                <p className="text-sm font-semibold text-sky-700">
                  {benefit.eyebrow}
                </p>
                <h3 className="mt-3 text-xl font-bold leading-tight text-slate-950">
                  {benefit.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
              Cómo funciona
            </p>
            <h2 className="mt-4 text-3xl font-black leading-tight text-slate-950 md:text-4xl">
              Un flujo simple para que el cobro no se te quede atrás.
            </h2>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {workflow.map((item) => (
              <div
                key={item.step}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white">
                  {item.step}
                </div>
                <h3 className="mt-5 text-xl font-bold text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 md:px-8 md:pb-24">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[32px] border border-slate-200 bg-slate-900 px-6 py-10 text-white shadow-xl shadow-slate-300/40 md:px-10 md:py-14">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-300">
                Empieza con una base clara
              </p>
              <h2 className="mt-4 text-3xl font-black leading-tight text-white md:text-5xl">
                Organiza tus cobros pendientes en un panel más limpio y fácil de mover.
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
                Crea tu cuenta, entra al panel y empieza a trabajar con clientes,
                facturas y recordatorios sin depender de un usuario demo ni de
                procesos improvisados.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/registro"
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3.5 text-sm font-semibold !text-slate-900 transition hover:bg-slate-100"
                >
                  Crear cuenta
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-semibold !text-white transition hover:bg-white/10"
                >
                  Ya tengo acceso
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
