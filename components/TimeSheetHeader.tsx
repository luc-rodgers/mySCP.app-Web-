"use client"
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Settings, LogOut, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface TimeSheetHeaderProps {
  todayHours: number;
  weekHours: number;
  employeeName: string;
  employeeTitle: string;
}

export function TimeSheetHeader({ todayHours, weekHours, employeeName, employeeTitle }: TimeSheetHeaderProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = employeeName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="mx-4 mt-4 mb-4 md:mx-0 md:mt-0 md:mb-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5 relative">
        {/* Settings gear — mobile only (desktop has sidebar) */}
        <div className="md:hidden absolute top-3 right-3" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(o => !o)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-10 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
              <button
                type="button"
                onClick={() => { setMenuOpen(false); router.push('/profile'); }}
                className="w-full flex items-center gap-2 text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <Pencil className="w-4 h-4 text-gray-500" />
                Edit Profile
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-gray-500" />
                Sign out
              </button>
            </div>
          )}
        </div>

        {/* Avatar + name */}
        <div className="flex flex-col items-center gap-2 mb-4">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center ring-4 ring-gray-50 shrink-0">
            <span className="text-base font-bold text-gray-700">{initials}</span>
          </div>
          <div className="text-center">
            <h2 className="text-gray-900 font-bold text-lg leading-tight">{employeeName}</h2>
            <span className="text-sm text-gray-400">{employeeTitle}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
            <p className="text-gray-400 text-xs mb-0.5">Today</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-2xl font-bold text-gray-800">{todayHours.toFixed(2)}</span>
              <span className="text-gray-400 text-xs">hrs</span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
            <p className="text-gray-400 text-xs mb-0.5">This Week</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-2xl font-bold text-gray-800">{weekHours.toFixed(2)}</span>
              <span className="text-gray-400 text-xs">hrs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
