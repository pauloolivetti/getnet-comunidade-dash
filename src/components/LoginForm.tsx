"use client";

import { useState } from "react";

export default function LoginForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: fd.get("user"), password: fd.get("password") }),
    });
    if (res.ok) {
      window.location.href = "/admin";
      return;
    }
    const j = await res.json().catch(() => ({}));
    setError(j.error ?? "Não foi possível entrar.");
    setLoading(false);
  }

  return (
    <form className="card login-card" onSubmit={onSubmit}>
      <div className="brand-mark" aria-hidden />
      <h1>Acesso restrito</h1>
      <p className="muted">Entre para atualizar os dados do painel.</p>
      <label>
        Usuário
        <input name="user" autoComplete="username" required />
      </label>
      <label>
        Senha
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn" disabled={loading}>{loading ? "Entrando…" : "Entrar"}</button>
      <a className="small muted" href="/">← Ver painel</a>
    </form>
  );
}
