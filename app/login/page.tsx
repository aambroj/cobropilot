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
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 md:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
              CobroPilot
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Acceso al panel
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/registro"
              className="inline-flex rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Crear cuenta
            </Link>
            <Link
              href="/"
              className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Volver a la portada
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 md:px-8 md:py-16">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-start">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
              Acceso
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight md:text-5xl">
              Entra al panel con tu email y sigue gestionando cobros.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
              Esta pantalla queda solo para acceder. Si todavía no tienes cuenta,
              usa la pantalla de registro para crearla y entrar al panel.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Acceso rápido</p>
                <p className="mt-2 text-sm text-slate-600">
                  Solo introduces el email y entras.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Sin mezclar flujos</p>
                <p className="mt-2 text-sm text-slate-600">
                  Login y registro ya quedan separados.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Mejorable después</p>
                <p className="mt-2 text-sm text-slate-600">
                  Más adelante podrás meter contraseña o auth más seria.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-2xl font-bold text-slate-900">Entrar ahora</h2>
            <p className="mt-2 text-sm text-slate-500">
              Usa el email de una cuenta ya creada.
            </p>

            {error === "email" ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                Introduce un email válido para continuar.
              </div>
            ) : null}

            {error === "not_found" ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                No existe ninguna cuenta con ese email. Usa Crear cuenta para registrarte.
              </div>
            ) : null}

            <form action={loginAccount} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="tuemail@empresa.com"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900"
                />
              </div>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
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
