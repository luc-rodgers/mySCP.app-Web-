"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Clock,
  User,
  Users,
  Briefcase,
  Wrench,
  Building2,
  LogOut,
  X,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const menuItems = [
  { id: "timesheet", label: "Timesheet", icon: Clock, href: "/timesheet" },
  { id: "profile", label: "Profile", icon: User, href: "/profile" },
  { id: "employees", label: "Employees", icon: Users, href: "/employees" },
  { id: "projects", label: "Projects", icon: Briefcase, href: "/projects" },
  { id: "equipment", label: "Equipment", icon: Wrench, href: "/equipment" },
  { id: "clients", label: "Clients", icon: Building2, href: "/clients" },
];

function SCPLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#030213]">
        <span className="text-white font-bold text-sm leading-none">
          <span className="text-red-500">S</span>CP
        </span>
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-[13px] font-semibold text-[#030213]">MySCP</span>
        <span className="text-[10px] text-[#717182]">Concrete Pumping</span>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 pt-6 pb-2 mt-8 md:mt-0">
        <SCPLogo />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {menuItems.map(({ id, label, icon: Icon, href }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={id}
              href={href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-gray-100 text-gray-900 shadow-sm"
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
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden bg-white shadow-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 w-64 transform transition-transform duration-300 ease-in-out z-40 shadow-sm ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:static md:w-[280px]`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
