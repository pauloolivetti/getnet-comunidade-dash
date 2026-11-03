import { NextResponse } from "next/server";
import { COOKIE, authConfigured, checkCredentials, cookieOptions, createSessionToken } from "@/lib/auth";

export async function POST(req: Request) {
  if (!authConfigured()) {
    return NextResponse.json(
      { error: "Login não configurado. Defina ADMIN_USER, ADMIN_PASSWORD e AUTH_SECRET (mín. 16 caracteres) no Vercel." },
      { status: 500 }
    );
  }
  const { user = "", password = "" } = await req.json().catch(() => ({}));
  if (!checkCredentials(String(user), String(password))) {
    await new Promise((r) => setTimeout(r, 800)); // freia tentativa de força bruta
    return NextResponse.json({ error: "Usuário ou senha inválidos." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, await createSessionToken(String(user)), cookieOptions);
  return res;
}
