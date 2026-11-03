"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { STATUS_ORDER, type DashData, type Status } from "@/lib/types";

// Categórico validado (ordem fixa por região): vermelho Getnet, roxo, âmbar, azul, rosa
const CAT = ["#EC0000", "#6B3FA0", "#D68A00", "#2F6FDE", "#E8579A"];
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

const nf = (n: number) => Math.round(n).toLocaleString("pt-BR");
const mesLabel = (ym: string) => {
  const [y, m] = ym.split("-");
  return m ? `${MESES[Number(m) - 1] ?? m}/${y.slice(2)}` : ym;
};

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="kpi">
      <span className="kpi-label">{label}</span>
      <strong className="kpi-value">{value}</strong>
      {hint && <span className="kpi-hint">{hint}</span>}
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const i = STATUS_ORDER.indexOf(status);
  return <span className={`badge badge-${i}`}>{status}</span>;
}

export default function Dashboard({ data, authed }: { data: DashData; authed: boolean }) {
  const [tab, setTab] = useState<"global" | "perfil">("global");
  const { regioes, evolucao, perfil } = data;

  const colorOf = useMemo(() => {
    const m: Record<string, string> = {};
    regioes.forEach((r, i) => (m[r.nome] = CAT[i] ?? "#7a7a7a"));
    return m;
  }, [regioes]);

  // ---------- Visão global ----------
  const g = useMemo(() => {
    const membros = regioes.reduce((s, r) => s + r.membros, 0);
    const ativos = regioes.reduce((s, r) => s + r.ativos, 0);
    const posts = regioes.reduce((s, r) => s + r.posts, 0);
    const comMembros = regioes.filter((r) => r.membros > 0);
    const w = (k: "engajamento" | "nps") =>
      membros ? comMembros.reduce((s, r) => s + r[k] * r.membros, 0) / membros : 0;
    const operando = regioes.filter((r) => r.status !== "Planejamento").length;

    const meses = [...new Set(evolucao.map((e) => e.mes))].sort();
    const total = (mes: string) => evolucao.filter((e) => e.mes === mes).reduce((s, e) => s + e.membros, 0);
    const last = meses[meses.length - 1];
    const prev = meses[meses.length - 2];
    const mom = last && prev && total(prev) ? (total(last) / total(prev) - 1) * 100 : null;

    const linhas = meses.map((mes) => {
      const row: Record<string, string | number> = { mes: mesLabel(mes) };
      evolucao.filter((e) => e.mes === mes).forEach((e) => (row[e.regiao] = e.membros));
      return row;
    });
    const ordenadas = [...regioes].sort((a, b) => b.membros - a.membros);
    return { membros, ativos, posts, engajamento: w("engajamento"), nps: w("nps"), operando, mom, linhas, ordenadas };
  }, [regioes, evolucao]);

  // ---------- Perfil ----------
  const opcoes = useMemo(() => [...new Set(perfil.map((p) => p.regiao))], [perfil]);
  const [sel, setSel] = useState(opcoes.includes("Brasil") ? "Brasil" : opcoes[0] ?? "Todas");

  const dims = useMemo(() => {
    const itens = perfil.filter((p) => sel === "Todas" || p.regiao === sel);
    const ordemDim = [...new Set(perfil.map((p) => p.dimensao))];
    return ordemDim.map((dimensao) => {
      const cats = [...new Set(perfil.filter((p) => p.dimensao === dimensao).map((p) => p.categoria))];
      const linhas = cats.map((categoria) => ({
        categoria,
        valor: itens.filter((p) => p.dimensao === dimensao && p.categoria === categoria).reduce((s, p) => s + p.valor, 0),
      }));
      const total = linhas.reduce((s, l) => s + l.valor, 0);
      const max = Math.max(...linhas.map((l) => (total ? l.valor / total : 0)), 0.0001);
      return { dimensao, linhas, total, max };
    });
  }, [perfil, sel]);

  const regSel = sel === "Todas" ? null : regioes.find((r) => r.nome === sel);
  const resumoSel = regSel ?? {
    membros: g.membros,
    ativos: g.ativos,
    engajamento: g.engajamento,
    nps: g.nps,
  };

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-in">
          <div className="title">
            <span className="brand-mark" aria-hidden />
            <div>
              <h1>Comunidade Global</h1>
              <span className="subtitle">Painel de gestão</span>
            </div>
          </div>
          <div className="top-actions">
            <span className="updated">
              {data.fonte === "mock" && <span className="mock-flag">Dados de exemplo</span>}
              Atualizado em{" "}
              {new Date(data.atualizadoEm).toLocaleString("pt-BR", {
                timeZone: "America/Sao_Paulo",
                dateStyle: "short",
                timeStyle: "short",
              })}
            </span>
            <Link className="btn btn-ghost" href={authed ? "/admin" : "/login"}>
              {authed ? "Atualizar dados" : "Entrar"}
            </Link>
          </div>
        </div>
        <nav className="tabs" aria-label="Perspectivas">
          <button className={tab === "global" ? "tab active" : "tab"} onClick={() => setTab("global")}>
            Visão global
          </button>
          <button className={tab === "perfil" ? "tab active" : "tab"} onClick={() => setTab("perfil")}>
            Perfil do cliente
          </button>
        </nav>
      </header>

      <main className="content">
        {tab === "global" && (
          <>
            <section className="kpis">
              <Kpi label="Membros" value={nf(g.membros)} hint={`${regioes.length} geografias`} />
              <Kpi
                label="Membros ativos"
                value={nf(g.ativos)}
                hint={g.membros ? `${Math.round((g.ativos / g.membros) * 100)}% da base` : undefined}
              />
              <Kpi
                label="Crescimento mensal"
                value={g.mom === null ? "—" : `${g.mom >= 0 ? "+" : ""}${g.mom.toFixed(1).replace(".", ",")}%`}
                hint="membros, mês a mês"
              />
              <Kpi label="Engajamento" value={`${Math.round(g.engajamento)}%`} hint="média ponderada" />
              <Kpi label="NPS" value={String(Math.round(g.nps))} hint="média ponderada" />
              <Kpi label="Geografias em andamento" value={`${g.operando} de ${regioes.length}`} hint="além do planejamento" />
            </section>

            <section className="grid-2">
              <div className="card">
                <h2>Evolução de membros por região</h2>
                <div className="chart">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={g.linhas} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="#ECE9E6" vertical={false} />
                      <XAxis dataKey="mes" tickLine={false} axisLine={{ stroke: "#CFCAC6" }} tick={{ fill: "#5C5752", fontSize: 12 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: "#5C5752", fontSize: 12 }} tickFormatter={nf} width={48} />
                      <Tooltip formatter={(v) => nf(Number(v))} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                      {regioes
                        .filter((r) => evolucao.some((e) => e.regiao === r.nome))
                        .map((r) => (
                          <Line
                            key={r.nome}
                            dataKey={r.nome}
                            stroke={colorOf[r.nome]}
                            strokeWidth={2}
                            dot={{ r: 4, stroke: "#fff", strokeWidth: 2 }}
                            activeDot={{ r: 5 }}
                            connectNulls
                          />
                        ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card">
                <h2>Tamanho da comunidade por região</h2>
                <div className="chart">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={g.ordenadas} layout="vertical" margin={{ top: 4, right: 48, left: 8, bottom: 0 }}>
                      <CartesianGrid stroke="#ECE9E6" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="nome" tickLine={false} axisLine={false} width={84} tick={{ fill: "#2A2623", fontSize: 13 }} />
                      <Tooltip formatter={(v) => nf(Number(v))} cursor={{ fill: "#F5F2EF" }} />
                      <Bar dataKey="membros" name="Membros" fill="#EC0000" radius={[0, 4, 4, 0]} barSize={22}>
                        <LabelList dataKey="membros" position="right" formatter={(v: unknown) => nf(Number(v))} style={{ fill: "#2A2623", fontSize: 12, fontWeight: 600 }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            <section className="card">
              <h2>Status de implantação</h2>
              <div className="roadmap">
                {regioes.map((r) => (
                  <div className="road-row" key={r.nome}>
                    <div className="road-name">
                      <span className="dot" style={{ background: colorOf[r.nome] }} />
                      {r.nome}
                    </div>
                    <StatusBadge status={r.status} />
                    <div className="progress" role="img" aria-label={`${r.nome}: ${r.implantacao}% implantado`}>
                      <div className="progress-fill" style={{ width: `${Math.min(r.implantacao, 100)}%` }} />
                    </div>
                    <span className="road-pct">{Math.round(r.implantacao)}%</span>
                    <span className="road-date">
                      {r.lancamento ? `${r.status === "Planejamento" ? "previsto" : "início"} ${mesLabel(r.lancamento)}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="card">
              <h2>Detalhe por região</h2>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Região</th>
                      <th>Status</th>
                      <th className="num">Membros</th>
                      <th className="num">Ativos</th>
                      <th className="num">Posts/mês</th>
                      <th className="num">Engajamento</th>
                      <th className="num">NPS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regioes.map((r) => (
                      <tr key={r.nome}>
                        <td>
                          <span className="dot" style={{ background: colorOf[r.nome] }} /> {r.nome}
                        </td>
                        <td><StatusBadge status={r.status} /></td>
                        <td className="num">{nf(r.membros)}</td>
                        <td className="num">{nf(r.ativos)}</td>
                        <td className="num">{nf(r.posts)}</td>
                        <td className="num">{r.membros ? `${Math.round(r.engajamento)}%` : "—"}</td>
                        <td className="num">{r.membros ? Math.round(r.nps) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {tab === "perfil" && (
          <>
            <div className="filter-row">
              <label>
                Região
                <select value={sel} onChange={(e) => setSel(e.target.value)}>
                  <option value="Todas">Todas as regiões</option>
                  {opcoes.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </label>
              {regSel && <StatusBadge status={regSel.status} />}
            </div>

            <section className="kpis kpis-4">
              <Kpi label="Membros" value={nf(resumoSel.membros)} />
              <Kpi
                label="Membros ativos"
                value={nf(resumoSel.ativos)}
                hint={resumoSel.membros ? `${Math.round((resumoSel.ativos / resumoSel.membros) * 100)}% da base` : undefined}
              />
              <Kpi label="Engajamento" value={`${Math.round(resumoSel.engajamento)}%`} />
              <Kpi label="NPS" value={String(Math.round(resumoSel.nps))} />
            </section>

            <section className="grid-profile">
              {dims.map((d) => (
                <div className="card" key={d.dimensao}>
                  <h2>{d.dimensao}</h2>
                  <ul className="hbars">
                    {d.linhas.map((l) => {
                      const p = d.total ? l.valor / d.total : 0;
                      return (
                        <li key={l.categoria} title={`${l.categoria}: ${nf(l.valor)} (${(p * 100).toFixed(1)}%)`}>
                          <span className="hb-label">{l.categoria}</span>
                          <span className="hb-track">
                            <span className="hb-fill" style={{ width: `${(p / d.max) * 100}%` }} />
                          </span>
                          <span className="hb-val">
                            {Math.round(p * 100)}% <em>{nf(l.valor)}</em>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </section>
          </>
        )}
      </main>

      <footer className="footer">Comunidade Global · uso interno</footer>
    </div>
  );
}
