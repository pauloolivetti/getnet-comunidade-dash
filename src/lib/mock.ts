import type { DashData, Evolucao, PerfilItem, Regiao } from "./types";

// ⚠️ DADOS FICTÍCIOS — servem só para demonstrar o dash até a planilha real ser enviada.

const regioes: Regiao[] = [
  { nome: "Brasil", status: "Escala", implantacao: 92, lancamento: "2026-03", membros: 4850, ativos: 3420, posts: 310, engajamento: 41, nps: 68 },
  { nome: "México", status: "Lançamento", implantacao: 64, lancamento: "2026-07", membros: 1320, ativos: 780, posts: 120, engajamento: 33, nps: 55 },
  { nome: "Chile", status: "Piloto", implantacao: 38, lancamento: "2026-09", membros: 410, ativos: 205, posts: 44, engajamento: 29, nps: 47 },
  { nome: "Argentina", status: "Piloto", implantacao: 30, lancamento: "2026-09", membros: 260, ativos: 118, posts: 31, engajamento: 26, nps: 42 },
  { nome: "Uruguai", status: "Planejamento", implantacao: 12, lancamento: "2027-01", membros: 0, ativos: 0, posts: 0, engajamento: 0, nps: 0 },
];

const MESES = ["2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"];

// Curva de crescimento (fração do valor final) por meses desde o lançamento
const CURVA = [0.18, 0.4, 0.62, 0.8, 0.92, 1];

function evolucao(): Evolucao[] {
  const out: Evolucao[] = [];
  for (const r of regioes) {
    if (r.membros === 0) continue;
    MESES.forEach((mes, i) => {
      if (mes < r.lancamento) return;
      const idx = i - MESES.findIndex((m) => m >= r.lancamento);
      // Brasil já está maduro: usa a parte final da curva
      const f = r.nome === "Brasil" ? [0.45, 0.58, 0.7, 0.82, 0.92, 1][i] : CURVA[Math.min(idx + 1, 5)] ?? 1;
      const membros = Math.round(r.membros * f);
      const ativos = Math.round(r.ativos * f);
      const posts = Math.round(r.posts * f);
      out.push({ mes, regiao: r.nome, membros, ativos, posts });
    });
  }
  return out;
}

const PESOS: Record<string, Record<string, number[]>> = {
  Segmento: { MEI: [0.34, 0.3, 0.28, 0.3], Pequeno: [0.38, 0.4, 0.42, 0.4], Médio: [0.2, 0.22, 0.22, 0.21], Grande: [0.08, 0.08, 0.08, 0.09] },
  Setor: {
    Varejo: [0.31, 0.28, 0.3, 0.27],
    Alimentação: [0.22, 0.25, 0.2, 0.24],
    Serviços: [0.19, 0.18, 0.2, 0.2],
    Saúde: [0.1, 0.1, 0.11, 0.1],
    "Beleza e bem-estar": [0.11, 0.11, 0.12, 0.11],
    Outros: [0.07, 0.08, 0.07, 0.08],
  },
  "Tempo de relacionamento": {
    "Menos de 1 ano": [0.18, 0.35, 0.5, 0.48],
    "1 a 3 anos": [0.34, 0.32, 0.27, 0.28],
    "3 a 5 anos": [0.26, 0.2, 0.15, 0.16],
    "Mais de 5 anos": [0.22, 0.13, 0.08, 0.08],
  },
  Produto: {
    Maquininha: [0.52, 0.5, 0.55, 0.52],
    "Link de pagamento": [0.18, 0.2, 0.17, 0.2],
    "E-commerce": [0.16, 0.16, 0.15, 0.14],
    "Conta digital": [0.14, 0.14, 0.13, 0.14],
  },
  "Origem do membro": {
    Indicação: [0.36, 0.3, 0.28, 0.3],
    "Time comercial": [0.28, 0.34, 0.38, 0.36],
    "Redes sociais": [0.22, 0.2, 0.18, 0.18],
    Eventos: [0.14, 0.16, 0.16, 0.16],
  },
};

function perfil(): PerfilItem[] {
  const out: PerfilItem[] = [];
  const comPerfil = regioes.filter((r) => r.membros > 0);
  for (const [dimensao, cats] of Object.entries(PESOS)) {
    for (const [categoria, pesos] of Object.entries(cats)) {
      comPerfil.forEach((r, i) => {
        out.push({ dimensao, categoria, regiao: r.nome, valor: Math.round(r.membros * pesos[i]) });
      });
    }
  }
  return out;
}

export const mockData: DashData = {
  atualizadoEm: "2026-11-02T12:00:00.000Z",
  fonte: "mock",
  regioes,
  evolucao: evolucao(),
  perfil: perfil(),
};
