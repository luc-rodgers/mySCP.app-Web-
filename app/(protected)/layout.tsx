import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";
import HelpButton from "@/components/HelpButton";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#f3f3f5" }}>
      <Sidebar />
      <main className="flex-1 ml-[280px] min-h-screen">
        <div className="p-8">{children}</div>
      </main>
      <HelpButton />
    </div>
  );
}
