import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createLoginSession, getCurrentUser } from "@/lib/auth";

type RegistroPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

async function registerAccount(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const companyName = String(formData.get("companyName") ?? "").trim();

  if (!email || !email.includes("@")) {
    redirect("/registro?error=email");
  }

  const existing = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existing) {
    redirect("/registro?error=exists");
  }

  const user = await prisma.user.create({
    data: {
      email,
      name: name || null,
      companyName: companyName || null,
    },
  });

  await createLoginSession(user.id);
  redirect("/dashboard");
}

export default async function RegistroPage({ searchParams }: RegistroPageProps) {
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
              Registro simple
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Ya tengo cuenta
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
              Registro
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight md:text-5xl">
              Crea tu cuenta y entra al panel en un minuto.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
              Para este MVP, el alta es simple: nombre, email y empresa. Al terminar,
              ya quedas dentro de CobroPilot con tu sesión creada.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Alta rápida</p>
                <p className="mt-2 text-sm text-slate-600">
                  Sin formularios largos ni pasos extra.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Acceso inmediato</p>
                <p className="mt-2 text-sm text-slate-600">
                  Se crea la sesión y entras al dashboard.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Base profesional</p>
                <p className="mt-2 text-sm text-slate-600">
                  Ya queda separado de la pantalla de login.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-2xl font-bold text-slate-900">Crear cuenta</h2>
            <p className="mt-2 text-sm text-slate-500">
              Registra una cuenta básica para empezar.
            </p>

            {error === "email" ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                Introduce un email válido para continuar.
              </div>
            ) : null}

            {error === "exists" ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                Ya existe una cuenta con ese email. Entra desde la pantalla de login.
              </div>
            ) : null}

            <form action={registerAccount} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nombre
                </label>
                <input
                  name="name"
                  placeholder="Tu nombre"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900"
                />
              </div>

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

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Empresa
                </label>
                <input
                  name="companyName"
                  placeholder="Nombre de tu empresa"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-900"
                />
              </div>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
              >
                Crear cuenta y entrar
              </button>
            </form>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-600">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="font-semibold text-sky-700">
                  Entra aquí
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
