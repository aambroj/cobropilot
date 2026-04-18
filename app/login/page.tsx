import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createLoginSession, getCurrentUser } from "@/lib/auth";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

async function loginAccount(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email || !email.includes("@")) {
    redirect("/login?error=email");
  }

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    redirect("/login?error=not_found");
  }

  await createLoginSession(user.id);
  redirect("/dashboard");
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    redirect("/dashboard");
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const error = resolvedSearchParams.error ?? "";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 md:px-8">
          <Link href="/" className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
              CobroPilot
            </p>
            <p className="mt-1 text-sm text-slate-500">Acceso al panel</p>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/registro"
              className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold !text-white transition hover:bg-slate-800"
            >
              Crear cuenta
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold !text-slate-800 transition hover:border-slate-300 hover:!text-slate-950"
            >
              Volver a la portada
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 pb-12 pt-10 md:px-8 md:pb-20 md:pt-16">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 md:p-8">
            <div className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">
              Acceso simple y rápido
            </div>

            <h1 className="mt-6 text-4xl font-black leading-tight text-slate-950 md:text-5xl md:leading-[1.05]">
              Entra a tu panel y retoma el seguimiento de cobros en segundos.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 md:text-lg md:leading-8">
              Usa el email de una cuenta ya creada para volver a clientes,
              facturas y recordatorios sin depender de notas sueltas ni de un
              acceso provisional.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Acceso directo
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Entras con tu email y vuelves al panel enseguida.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Flujo separado
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Login y registro quedan claros para no mezclar pasos.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Base ligera
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Una entrada simple para seguir iterando rápido en el MVP.
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-[28px] border border-slate-200 bg-slate-950 p-5 text-white md:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">
                Qué retomas al entrar
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-300">
                    Clientes
                  </p>
                  <p className="mt-2 text-lg font-bold text-white">Base ordenada</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-300">
                    Facturas
                  </p>
                  <p className="mt-2 text-lg font-bold text-white">Seguimiento claro</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-300">
                    Recordatorios
                  </p>
                  <p className="mt-2 text-lg font-bold text-white">Avisos listos</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
              Entrar ahora
            </p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950">
              Accede con tu email
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Usa el email de una cuenta ya creada para entrar al panel de
              CobroPilot.
            </p>

            {error === "email" ? (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                Introduce un email válido para continuar.
              </div>
            ) : null}

            {error === "not_found" ? (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                No existe ninguna cuenta con ese email. Usa Crear cuenta para
                registrarte.
              </div>
            ) : null}

            <form action={loginAccount} className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="tuemail@empresa.com"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900"
                />
              </div>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-semibold !text-white transition hover:bg-slate-800"
              >
                Entrar a CobroPilot
              </button>
            </form>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-600">
                ¿Todavía no tienes cuenta?{" "}
                <Link href="/registro" className="font-semibold text-sky-700">
                  Crear cuenta
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
