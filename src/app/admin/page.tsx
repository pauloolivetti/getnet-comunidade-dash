import Link from "next/link";
import { redirect } from "next/navigation";
import UploadForm from "@/components/UploadForm";
import { isAuthed } from "@/lib/auth";
import { loadData } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAuthed())) redirect("/login");
  const data = await loadData();
  return (
    <main className="center-page">
      <section className="card admin-card">
        <Link href="/" className="back-link">← Voltar ao painel</Link>
        <h1>Atualizar dados</h1>
        <p className="muted">
          Envie a planilha da comunidade (.xlsx). Ao concluir, o painel é atualizado automaticamente.
        </p>
        <p className="muted small">
          Dados atuais: <strong>{data.fonte === "mock" ? "exemplo (fictícios)" : "planilha enviada"}</strong> ·{" "}
          {new Date(data.atualizadoEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
        </p>
        <UploadForm />
        <p className="small muted">
          Precisa do formato? <a href="/api/template">Baixar planilha-modelo</a>
        </p>
      </section>
    </main>
  );
}
