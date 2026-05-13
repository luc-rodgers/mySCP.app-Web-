"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/timesheet", label: "Timesheet" },
  { href: "/history", label: "History" },
  { href: "/analytics", label: "Analytics" },
];

export default function DesktopTabToggle() {
  const pathname = usePathname();
  return (
    <div className="hidden md:block mb-4">
      <div className="flex bg-gray-200 rounded-xl p-1 gap-1 max-w-md">
        {tabs.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 py-2 text-center text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
