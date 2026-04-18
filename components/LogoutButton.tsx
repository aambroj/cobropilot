import { redirect } from "next/navigation";
import { clearLoginSession } from "@/lib/auth";

async function logout() {
  "use server";

  await clearLoginSession();
  redirect("/login");
}

export default function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold !text-white transition hover:bg-slate-800"
      >
        Cerrar sesión
      </button>
    </form>
  );
}
