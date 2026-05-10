"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  firstName: string;
  lastName: string;
  classification: string;
}

export default function MobileProfileHeader({ firstName, lastName, classification }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Lock body scroll when sheet open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Hide on /profile (admins on desktop) — sheet replaces the page on mobile
  if (pathname === '/profile' || pathname.startsWith('/profile/')) return null;

  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || '?';
  const fullName = `${firstName ?? ''} ${lastName ?? ''}`.trim();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push('/login');
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="md:hidden sticky top-0 z-20 w-full flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 active:bg-gray-50 text-left"
      >
        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-gray-700">{initials}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-gray-900 truncate">{fullName || '—'}</div>
          {classification && (
            <div className="text-xs text-gray-400 truncate">{classification}</div>
          )}
        </div>
      </button>

      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 transition-opacity"
            onClick={() => setOpen(false)}
          />
          {/* Sheet */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl pb-6"
            style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))' }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-2.5 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            {/* Close */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Profile card */}
            <div className="px-6 pt-4 pb-2 flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center ring-4 ring-gray-50">
                <span className="text-xl font-bold text-gray-700">{initials}</span>
              </div>
              <div className="text-center">
                <h2 className="text-gray-900 font-bold text-lg leading-tight">{fullName || '—'}</h2>
                {classification && (
                  <span className="text-sm text-gray-400 mt-0.5 block">{classification}</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="px-4 pt-4 mt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
