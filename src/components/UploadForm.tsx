"use client";

import { useState } from "react";

export default function UploadForm() {
  const [state, setState] = useState<{ kind: "idle" | "loading" | "ok" | "error"; msg?: string }>({ kind: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const file = fd.get("file");
    if (!(file instanceof File) || file.size === 0) {
      setState({ kind: "error", msg: "Selecione um arquivo .xlsx." });
      return;
    }
    setState({ kind: "loading" });
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const j = await res.json().catch(() => ({}));
    if (res.ok) {
      setState({
        kind: "ok",
        msg: `Painel atualizado: ${j.resumo.regioes} regiões, ${j.resumo.evolucao} linhas de evolução, ${j.resumo.perfil} linhas de perfil.`,
      });
    } else if (res.status === 401) {
      window.location.href = "/login";
    } else {
      setState({ kind: "error", msg: j.error ?? "Falha no envio." });
    }
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <form onSubmit={onSubmit} className="upload-form">
      <input type="file" name="file" accept=".xlsx" required />
      <div className="row">
        <button className="btn" disabled={state.kind === "loading"}>
          {state.kind === "loading" ? "Processando…" : "Enviar e atualizar painel"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={logout}>Sair</button>
      </div>
      {state.kind === "ok" && (
        <p className="ok" role="status">{state.msg} <a href="/">Ver painel →</a></p>
      )}
      {state.kind === "error" && <p className="error" role="alert">{state.msg}</p>}
    </form>
  );
}
