import { Redis } from "@upstash/redis";
import { promises as fs } from "fs";
import path from "path";
import { mockData } from "./mock";
import type { DashData } from "./types";

const KEY = "getnet:comunidade:dashboard";
const DEV_FILE = path.join(process.cwd(), ".data", "dashboard.json");

function redis(): Redis | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? new Redis({ url, token }) : null;
}

export async function loadData(): Promise<DashData> {
  const r = redis();
  try {
    if (r) {
      const d = await r.get<DashData>(KEY);
      if (d) return d;
    } else if (!process.env.VERCEL) {
      const raw = await fs.readFile(DEV_FILE, "utf8");
      return JSON.parse(raw) as DashData;
    }
  } catch {
    // sem dados salvos ainda -> cai no mock
  }
  return mockData;
}

export async function saveData(data: DashData): Promise<void> {
  const r = redis();
  if (r) {
    await r.set(KEY, data);
    return;
  }
  if (process.env.VERCEL) {
    throw new Error(
      "Banco não configurado. No Vercel, adicione o Upstash Redis em Storage (Marketplace) e refaça o deploy."
    );
  }
  await fs.mkdir(path.dirname(DEV_FILE), { recursive: true });
  await fs.writeFile(DEV_FILE, JSON.stringify(data));
}
