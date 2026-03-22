"use client"

interface TimeSheetHeaderProps {
  todayHours: number;
  weekHours: number;
  employeeName: string;
  employeeTitle: string;
}

export function TimeSheetHeader({ todayHours, weekHours, employeeName, employeeTitle }: TimeSheetHeaderProps) {
  const initials = employeeName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="mx-4 mt-4 mb-4 md:mx-0 md:mt-0 md:mb-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-5">
        {/* Avatar + name */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center ring-4 ring-gray-50 shrink-0">
            <span className="text-base font-bold text-gray-700">{initials}</span>
          </div>
          <div>
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
