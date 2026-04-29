import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ConfirmType = "invite" | "recovery" | "signup" | "email" | "magiclink" | "email_change";

const ALLOWED_TYPES: ConfirmType[] = [
  "invite",
  "recovery",
  "signup",
  "email",
  "magiclink",
  "email_change",
];

const SAFE_NEXT = /^\/[A-Za-z0-9_\-/]*$/;

export default function ConfirmPage({
  searchParams,
}: {
  searchParams: { token_hash?: string; type?: string; next?: string };
}) {
  const tokenHash = searchParams.token_hash;
  const rawType = searchParams.type;
  const rawNext = searchParams.next;

  if (!tokenHash || !rawType || !ALLOWED_TYPES.includes(rawType as ConfirmType)) {
    redirect("/login?error=The+link+is+invalid+or+has+expired.");
  }

  const type = rawType as ConfirmType;
  const next = rawNext && SAFE_NEXT.test(rawNext) ? rawNext : "/auth/set-password";

  async function confirm() {
    "use server";
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash!,
    });

    if (error) {
      redirect(
        "/login?error=" + encodeURIComponent("The link is invalid or has expired.")
      );
    }

    redirect(next);
  }

  const isRecovery = type === "recovery";
  const heading = isRecovery ? "Reset your password" : "Welcome to MySCP";
  const subtext = isRecovery
    ? "Click below to continue and choose a new password."
    : "Click below to activate your account and set a password.";
  const buttonLabel = isRecovery ? "Continue" : "Activate account";

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "#f3f3f5" }}
    >
      <div className="w-full max-w-sm">
        <div
          className="bg-white rounded-[0.625rem] shadow-sm border pt-8 pb-8 px-8"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex justify-center mb-6">
            <Image
              src="/myscp.jpeg"
              alt="MySCP"
              width={220}
              height={90}
              className="object-contain"
              priority
            />
          </div>
          <h2 className="text-lg font-semibold text-[#030213] mb-1">{heading}</h2>
          <p className="text-sm text-[#717182] mb-6">{subtext}</p>

          <form action={confirm}>
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-[0.625rem] bg-[#030213] text-white text-sm font-medium hover:bg-[#1a1a2e] transition-colors"
            >
              {buttonLabel}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#717182] mt-6">
          © {new Date().getFullYear()} Specialised Concrete Pumping
        </p>
      </div>
    </div>
  );
}
