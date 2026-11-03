export type Status = "Planejamento" | "Piloto" | "Lançamento" | "Escala";

export const STATUS_ORDER: Status[] = ["Planejamento", "Piloto", "Lançamento", "Escala"];

export interface Regiao {
  nome: string;
  status: Status;
  implantacao: number; // 0-100
  lancamento: string; // YYYY-MM
  membros: number;
  ativos: number;
  posts: number; // posts/mês
  engajamento: number; // 0-100
  nps: number; // -100 a 100
}

export interface Evolucao {
  mes: string; // YYYY-MM
  regiao: string;
  membros: number;
  ativos: number;
  posts: number;
}

export interface PerfilItem {
  dimensao: string;
  categoria: string;
  regiao: string;
  valor: number;
}

export interface DashData {
  atualizadoEm: string;
  fonte: "mock" | "upload";
  regioes: Regiao[];
  evolucao: Evolucao[];
  perfil: PerfilItem[];
}
