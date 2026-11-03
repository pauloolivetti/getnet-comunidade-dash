import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { isAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await isAuthed()) redirect("/admin");
  return (
    <main className="center-page">
      <LoginForm />
    </main>
  );
}
