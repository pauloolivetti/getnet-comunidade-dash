import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { parseWorkbook } from "@/lib/parse";
import { saveData } from "@/lib/store";

export const runtime = "nodejs";

const MAX_BYTES = 4 * 1024 * 1024; // limite de body das funções do Vercel é ~4,5 MB

export async function POST(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Não autorizado. Faça login." }, { status: 401 });
  }
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Envie um arquivo no campo 'file'." }, { status: 400 });
  }
  if (!/\.xlsx$/i.test(file.name)) {
    return NextResponse.json({ error: "Formato inválido: envie um arquivo .xlsx." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Arquivo acima de 4 MB." }, { status: 413 });
  }
  try {
    const data = parseWorkbook(await file.arrayBuffer());
    await saveData(data);
    return NextResponse.json({
      ok: true,
      resumo: { regioes: data.regioes.length, evolucao: data.evolucao.length, perfil: data.perfil.length },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Falha ao processar a planilha." }, { status: 422 });
  }
}
