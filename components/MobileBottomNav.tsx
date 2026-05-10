"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, History, BarChart3 } from "lucide-react";

const tabs = [
  { href: "/timesheet", label: "Timesheet", Icon: Clock },
  { href: "/history", label: "History", Icon: History },
  { href: "/analytics", label: "Analytics", Icon: BarChart3 },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
    >
      <div className="flex">
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-4 transition-colors ${
                active ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className={`w-6 h-6 ${active ? 'text-[#030213]' : ''}`} strokeWidth={active ? 2.5 : 2} />
              <span className={`text-xs ${active ? 'font-semibold' : ''}`}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
