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
    <div className="mx-4 mt-4 mb-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-3 ring-4 ring-gray-50">
            <span className="text-2xl font-bold text-gray-700">{initials}</span>
          </div>
          <h2 className="text-gray-900 font-bold text-xl mb-1">{employeeName}</h2>
          <span className="text-sm text-gray-400">{employeeTitle}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
            <p className="text-gray-400 text-xs mb-1">Today</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-3xl font-bold text-gray-800">{todayHours.toFixed(2)}</span>
              <span className="text-gray-400 text-sm">hrs</span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
            <p className="text-gray-400 text-xs mb-1">This Week</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-3xl font-bold text-gray-800">{weekHours.toFixed(2)}</span>
              <span className="text-gray-400 text-sm">hrs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
