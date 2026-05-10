import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";
import { ToastProvider } from "@/components/Toast";
import MobileBottomNav from "@/components/MobileBottomNav";

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

  const { data: employee } = await supabase
    .from("employees")
    .select("role")
    .eq("user_id", user.id)
    .single();

  const isAdmin = employee?.role?.toLowerCase() === "admin";

  return (
    <ToastProvider>
      <div className="flex min-h-screen" style={{ backgroundColor: "#f3f3f5" }}>
        <Sidebar isAdmin={isAdmin} />
        <main className="flex-1 min-h-screen pb-24 md:pb-0">
          <div className="max-w-6xl mx-auto w-full px-6 py-6">{children}</div>
        </main>
        {!isAdmin && <MobileBottomNav />}
      </div>
    </ToastProvider>
  );
}
