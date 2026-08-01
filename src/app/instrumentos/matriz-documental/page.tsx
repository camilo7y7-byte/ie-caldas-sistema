import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AppShell } from "@/components/AppShell";
import { ROLE_LABELS } from "@/lib/auth-utils";
import { MatrizForm } from "./MatrizForm";

export default async function MatrizPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/dashboard");

  return (
    <AppShell fullName={session.fullName} roleLabel={ROLE_LABELS.ADMIN}>
      <MatrizForm />
    </AppShell>
  );
}
