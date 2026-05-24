"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Clock,
  User,
  Users,
  Briefcase,
  Building2,
  ClipboardList,
  LogOut,
  X,
  Menu,
  History,
  BarChart3,
} from "lucide-react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

type MenuItem = { id: string; label: string; icon: typeof Clock; href: string };

const adminMenuItems: MenuItem[] = [
  { id: "timesheet",  label: "My Profile",     icon: User,          href: "/timesheet" },
  { id: "timesheets", label: "Administration", icon: ClipboardList, href: "/timesheets" },
  { id: "employees",  label: "Employees",      icon: Users,         href: "/employees" },
  { id: "projects",   label: "Projects",       icon: Briefcase,     href: "/projects" },
  { id: "clients",    label: "Clients",        icon: Building2,     href: "/clients" },
];

function SCPLogo() {
  return (
    <div className="flex items-center justify-center">
      <Image
        src="/myscp.jpeg"
        alt="MySCP"
        width={180}
        height={80}
        className="object-contain w-44 h-auto"
        priority
      />
    </div>
  );
}

export default function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Non-admins get the banner + bottom nav; no sidebar at all.
  if (!isAdmin) return null;

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 pt-6 pb-4 mt-8 md:mt-0">
        <SCPLogo />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-2 overflow-y-auto">
        {adminMenuItems.map(({ id, label, icon: Icon, href }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={id}
              href={href}
              onClick={(e) => {
                setIsOpen(false);
                if (isActive) {
                  e.preventDefault();
                  router.refresh();
                }
              }}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 pb-6">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile menu button — admins only; non-admins use the bottom nav */}
      {isAdmin && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed z-50 md:hidden bg-white shadow-md"
          style={{ top: 'max(1rem, env(safe-area-inset-top, 1rem))', left: 'max(1rem, env(safe-area-inset-left, 1rem))' }}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      )}

      {/* Mobile overlay */}
      {isOpen && isAdmin && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar — hidden entirely on mobile for non-admins (replaced by bottom nav) */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 w-64 transform transition-transform duration-300 ease-in-out z-40 shadow-sm ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:static md:w-[280px] ${isAdmin ? '' : 'hidden md:flex'}`}
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return;
          const delta = touchStartX.current - e.changedTouches[0].clientX;
          if (delta > 50) setIsOpen(false);
          touchStartX.current = null;
        }}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
