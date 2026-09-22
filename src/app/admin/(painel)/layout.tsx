import Link from "next/link";
import { redirect } from "next/navigation";
import { encerrarSessao, exigirProfessor } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Tudo dentro deste grupo de rotas exige professor logado.
 * /admin/login fica fora do grupo, por isso não cai num laço de redirect.
 */
export default async function LayoutPainel({ children }: { children: React.ReactNode }) {
  const sessao = await exigirProfessor();

  async function sair() {
    "use server";
    await encerrarSessao();
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
          <Link href="/admin" className="font-bold text-slate-900">
            Prova<span className="text-blue-700">Online</span>
          </Link>

          <nav className="flex flex-wrap items-center gap-1 text-sm">
            <Item href="/admin/ucs">Unidades</Item>
            <Item href="/admin/questoes">Questões</Item>
            <Item href="/admin/avaliacoes">Avaliações</Item>
            <Item href="/admin/relatorios">Relatórios</Item>
          </nav>

          <form action={sair} className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline">{sessao.nome}</span>
            <button type="submit" className="text-sm text-slate-500 hover:text-slate-800 hover:underline">
              Sair
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}

function Item({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="rounded-lg px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">
      {children}
    </Link>
  );
}
