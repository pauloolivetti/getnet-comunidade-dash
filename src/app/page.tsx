import { redirect } from "next/navigation";
import Dashboard from "@/components/Dashboard";
import { isAuthed } from "@/lib/auth";
import { loadData } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const authed = await isAuthed();
  if (process.env.VIEW_REQUIRES_LOGIN === "true" && !authed) redirect("/login");
  const data = await loadData();
  return <Dashboard data={data} authed={authed} />;
}
