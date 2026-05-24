"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, History, BarChart3 } from "lucide-react";

const tabs = [
  { href: "/timesheet", label: "Timesheet", Icon: Clock },
  { href: "/history",   label: "History",   Icon: History },
  { href: "/analytics", label: "Analytics", Icon: BarChart3 },
];

export default function DesktopTabToggle() {
  const pathname = usePathname();
  return (
    <div className="hidden md:block mb-6 border-b border-gray-200">
      <div className="flex items-center gap-1 justify-center">
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors -mb-px border-b-2 ${
                active
                  ? 'border-[#030213] text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={active ? 2.5 : 2} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
