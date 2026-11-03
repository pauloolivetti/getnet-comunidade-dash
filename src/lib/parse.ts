import * as XLSX from "xlsx";
import { STATUS_ORDER, type DashData, type Evolucao, type PerfilItem, type Regiao, type Status } from "./types";

/**
 * ⚙️ MAPEAMENTO DA PLANILHA
 * Hoje espera 3 abas: "Regioes", "Evolucao", "Perfil" (veja /api/template).
 * Quando chegar a planilha real, basta ajustar SHEETS e COLS abaixo
 * (nomes aceitos para cada aba/coluna, sem acento e sem diferenciar maiúsculas).
 */
const SHEETS = {
  regioes: ["regioes", "regiao", "geografias"],
  evolucao: ["evolucao", "historico", "mensal"],
  perfil: ["perfil", "perfilcliente", "clientes"],
};

const COLS = {
  regioes: {
    nome: ["regiao", "geografia", "pais"],
    status: ["status", "fase"],
    implantacao: ["implantacao", "implantacaopct", "progresso"],
    lancamento: ["lancamento", "datalancamento", "inicio"],
    membros: ["membros", "tamanho", "totalmembros"],
    ativos: ["ativos", "membrosativos"],
    posts: ["posts", "postsmes"],
    engajamento: ["engajamento", "engajamentopct"],
    nps: ["nps"],
  },
  evolucao: {
    mes: ["mes", "periodo", "data"],
    regiao: ["regiao", "geografia", "pais"],
    membros: ["membros"],
    ativos: ["ativos", "membrosativos"],
    posts: ["posts", "postsmes"],
  },
  perfil: {
    dimensao: ["dimensao", "indicador", "categoriaprincipal"],
    categoria: ["categoria", "faixa", "valorcategoria"],
    regiao: ["regiao", "geografia", "pais"],
    valor: ["valor", "membros", "quantidade", "qtd"],
  },
} as const;

const norm = (s: unknown) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

function findSheet(wb: XLSX.WorkBook, names: string[], label: string) {
  const name = wb.SheetNames.find((n) => names.includes(norm(n)));
  if (!name) {
    throw new Error(`Aba "${label}" não encontrada. Abas na planilha: ${wb.SheetNames.join(", ")}.`);
  }
  return wb.Sheets[name];
}

function rows<T extends Record<string, readonly string[]>>(
  ws: XLSX.WorkSheet,
  cols: T,
  label: string
): Record<keyof T, unknown>[] {
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null, raw: true });
  if (raw.length === 0) throw new Error(`A aba "${label}" está vazia.`);
  const headers = Object.keys(raw[0]);
  const map = {} as Record<keyof T, string>;
  for (const key of Object.keys(cols) as (keyof T)[]) {
    const h = headers.find((h) => cols[key].includes(norm(h)));
    if (!h) throw new Error(`Coluna "${String(key)}" não encontrada na aba "${label}". Colunas: ${headers.join(", ")}.`);
    map[key] = h;
  }
  return raw
    .filter((r) => Object.values(r).some((v) => v !== null && v !== ""))
    .map((r) => {
      const o = {} as Record<keyof T, unknown>;
      for (const key of Object.keys(map) as (keyof T)[]) o[key] = r[map[key]];
      return o;
    });
}

function num(v: unknown): number {
  if (typeof v === "number") return v;
  const s = String(v ?? "").replace("%", "").trim();
  // "1.234,5" (pt-BR) -> 1234.5 ; "0.41" continua 0.41
  const n = Number(s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s);
  return Number.isFinite(n) ? n : 0;
}

// aceita 0.41 ou 41 -> 41
function pct(v: unknown): number {
  const n = num(v);
  return n > 0 && n <= 1 ? Math.round(n * 1000) / 10 : n;
}

function ym(v: unknown): string {
  if (v instanceof Date) return `${v.getUTCFullYear()}-${String(v.getUTCMonth() + 1).padStart(2, "0")}`;
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    return `${d.y}-${String(d.m).padStart(2, "0")}`;
  }
  const s = String(v ?? "").trim();
  const m = s.match(/^(\d{4})-(\d{1,2})/) || s.match(/^(\d{1,2})\/(\d{4})$/);
  if (m) return m[1].length === 4 ? `${m[1]}-${m[2].padStart(2, "0")}` : `${m[2]}-${m[1].padStart(2, "0")}`;
  return s;
}

function status(v: unknown): Status {
  const k = norm(v);
  return STATUS_ORDER.find((s) => norm(s) === k) ?? "Planejamento";
}

export function parseWorkbook(buf: ArrayBuffer): DashData {
  // sem cellDates: datas chegam como número serial e são tratadas em ym() (evita desvio de fuso)
  const wb = XLSX.read(buf, { type: "array" });

  const regioes: Regiao[] = rows(findSheet(wb, SHEETS.regioes, "Regioes"), COLS.regioes, "Regioes").map((r) => ({
    nome: String(r.nome).trim(),
    status: status(r.status),
    implantacao: pct(r.implantacao),
    lancamento: ym(r.lancamento),
    membros: num(r.membros),
    ativos: num(r.ativos),
    posts: num(r.posts),
    engajamento: pct(r.engajamento),
    nps: num(r.nps),
  }));

  const evolucao: Evolucao[] = rows(findSheet(wb, SHEETS.evolucao, "Evolucao"), COLS.evolucao, "Evolucao").map((r) => ({
    mes: ym(r.mes),
    regiao: String(r.regiao).trim(),
    membros: num(r.membros),
    ativos: num(r.ativos),
    posts: num(r.posts),
  }));

  const perfil: PerfilItem[] = rows(findSheet(wb, SHEETS.perfil, "Perfil"), COLS.perfil, "Perfil").map((r) => ({
    dimensao: String(r.dimensao).trim(),
    categoria: String(r.categoria).trim(),
    regiao: String(r.regiao).trim(),
    valor: num(r.valor),
  }));

  return { atualizadoEm: new Date().toISOString(), fonte: "upload", regioes, evolucao, perfil };
}
