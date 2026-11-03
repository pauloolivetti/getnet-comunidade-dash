import * as XLSX from "xlsx";
import { mockData } from "@/lib/mock";

// Gera a planilha-modelo (com os dados fictícios) para mostrar o formato esperado no upload.
export async function GET() {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      mockData.regioes.map((r) => ({
        Regiao: r.nome,
        Status: r.status,
        "Implantacao (%)": r.implantacao,
        Lancamento: r.lancamento,
        Membros: r.membros,
        Ativos: r.ativos,
        "Posts (mes)": r.posts,
        "Engajamento (%)": r.engajamento,
        NPS: r.nps,
      }))
    ),
    "Regioes"
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      mockData.evolucao.map((e) => ({ Mes: e.mes, Regiao: e.regiao, Membros: e.membros, Ativos: e.ativos, Posts: e.posts }))
    ),
    "Evolucao"
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      mockData.perfil.map((p) => ({ Dimensao: p.dimensao, Categoria: p.categoria, Regiao: p.regiao, Valor: p.valor }))
    ),
    "Perfil"
  );
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="modelo-comunidade.xlsx"',
    },
  });
}
