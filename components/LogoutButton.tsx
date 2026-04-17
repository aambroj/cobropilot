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
        className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
      >
        Cerrar sesión
      </button>
    </form>
  );
}
