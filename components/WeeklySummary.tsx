"use client"
import { TimeEntry, Employee } from '@/lib/types';
import { ArrowLeft, Download, Calendar } from 'lucide-react';
import { Button } from './ui/button';

interface WeeklySummaryProps {
  entries: TimeEntry[];
  employee: Employee;
  onBack: () => void;
}

interface DayRow {
  weekday: string;
  date: string;
  start: string;
  onSite: number;
  offSite: number;
  finish: string;
  grossHours: number;
  timeLunchTaken: string;
  lunchDeduct: string;
  noClaim: string;
  netHours: number;
  ordinaryTime: number;
  overtimeX2: number;
  lunchPenalty: number;
  inclementWeather: string;
  prodAllowance: string;
  siteAllowance: string;
  heightAllowance: string;
  mealAllowance: string;
  cribBreak: string;
  travel: string;
  rdo: string;
  leaveHours: string;
  siteName: string;
  comments: string;
}

export function WeeklySummary({ entries, employee, onBack }: WeeklySummaryProps) {
  // Get current week's Monday
  const today = new Date();
  const currentDay = today.getDay();
  const diff = currentDay === 0 ? -6 : 1 - currentDay; // Adjust when day is Sunday
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  monday.setHours(0, 0, 0, 0);

  // Generate array of dates for the week (Monday to Sunday)
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date;
  });

  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Build day rows from entries
  const dayRows: DayRow[] = weekDates.map((date, index) => {
    const dateKey = formatDateKey(date);
    const entry = entries.find(e => e.date === dateKey);

    if (!entry || entry.projects.length === 0) {
      return {
        weekday: weekdays[index],
        date: formatDate(date),
        start: '',
        onSite: 0,
        offSite: 0,
        finish: '',
        grossHours: 0,
        timeLunchTaken: '',
        lunchDeduct: '',
        noClaim: 'N',
        netHours: 0,
        ordinaryTime: 0,
        overtimeX2: 0,
        lunchPenalty: 0,
        inclementWeather: '',
        prodAllowance: '',
        siteAllowance: '',
        heightAllowance: '',
        mealAllowance: '',
        cribBreak: '',
        travel: '',
        rdo: '',
        leaveHours: '',
        siteName: '',
        comments: '',
      };
    }

    // Helper function to round down to nearest 0.25 increment
    const roundToQuarterHour = (hours: number) => {
      return Math.floor(hours * 4) / 4;
    };

    // Calculate gross hours from Start and Finish times
    const calculateHoursDifference = (start: string, end: string): number => {
      const [startHour, startMin] = start.split(':').map(Number);
      const [endHour, endMin] = end.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      return roundToQuarterHour((endMinutes - startMinutes) / 60);
    };

    const grossHours = calculateHoursDifference(entry.depotStart, entry.depotFinish);
    
    // Aggregate on-site and off-site hours from projects
    const totalOnSite = entry.projects.reduce((sum, p) => {
      const [startHour, startMin] = p.siteStart.split(':').map(Number);
      const [finishHour, finishMin] = p.siteFinish.split(':').map(Number);
      const hours = (finishHour * 60 + finishMin - startHour * 60 - startMin) / 60;
      return sum + roundToQuarterHour(hours);
    }, 0);
    const totalOffSite = 0; // No longer tracking off-site separately
    
    const hasLunch = entry.projects.some(p => p.lunch);
    const hasLunchPenalty = entry.projects.some(p => p.lunchPenalty);
    const lunchPenaltyHours = hasLunchPenalty ? 0.5 : 0;
    
    const lunchDeduct = hasLunch && !hasLunchPenalty ? 0.5 : 0;
    const netHours = roundToQuarterHour(grossHours - lunchDeduct - lunchPenaltyHours);
    
    // Calculate ordinary time and overtime
    const ordinaryTime = roundToQuarterHour(Math.min(netHours, 8));
    const overtimeX2 = roundToQuarterHour(Math.max(0, netHours - 8));
    
    const hasWeather = entry.projects.some(p => p.weather);
    const weatherTypes = entry.projects
      .filter(p => p.weather && p.weatherType)
      .map(p => p.weatherType)
      .join(', ');
    
    const siteNames = [...new Set(entry.projects.map(p => p.project))].join(', ');
    
    // Meal allowance if > 10 hours
    const mealAllowance = grossHours > 10 ? 'Y' : '';
    const cribBreak = grossHours >= 10 ? 'Y' : '';

    return {
      weekday: weekdays[index],
      date: formatDate(date),
      start: entry.depotStart,
      onSite: totalOnSite,
      offSite: totalOffSite,
      finish: entry.depotFinish,
      grossHours,
      timeLunchTaken: hasLunch ? '30 min' : '',
      lunchDeduct: hasLunch && !hasLunchPenalty ? 'Y' : '',
      noClaim: hasLunch ? '' : 'N',
      netHours,
      ordinaryTime,
      overtimeX2,
      lunchPenalty: lunchPenaltyHours,
      inclementWeather: hasWeather ? weatherTypes || 'Y' : '',
      prodAllowance: '',
      siteAllowance: '',
      heightAllowance: '',
      mealAllowance,
      cribBreak,
      travel: '',
      rdo: '',
      leaveHours: '',
      siteName: siteNames,
      comments: '',
    };
  });

  // Calculate totals
  const totals = dayRows.reduce((acc, row) => ({
    onSite: acc.onSite + row.onSite,
    offSite: acc.offSite + row.offSite,
    grossHours: acc.grossHours + row.grossHours,
    netHours: acc.netHours + row.netHours,
    ordinaryTime: acc.ordinaryTime + row.ordinaryTime,
    overtimeX2: acc.overtimeX2 + row.overtimeX2,
    lunchPenalty: acc.lunchPenalty + row.lunchPenalty,
  }), {
    onSite: 0,
    offSite: 0,
    grossHours: 0,
    netHours: 0,
    ordinaryTime: 0,
    overtimeX2: 0,
    lunchPenalty: 0,
  });

  const weekStart = formatDate(weekDates[0]);
  const weekEnd = formatDate(weekDates[6]);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <Button
              onClick={onBack}
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
          
          <div>
            <h1 className="text-gray-900 mb-1">Weekly Timesheet Summary</h1>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <Calendar className="w-4 h-4" />
              <span>{weekStart} - {weekEnd}</span>
            </div>
            <div className="text-sm text-gray-900 mt-2">{employee.name} • {employee.classification}</div>
          </div>
        </div>
      </div>

      {/* Table Container - Horizontally Scrollable */}
      <div className="p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th className="px-2 py-2 text-left border-r border-gray-300 sticky left-0 bg-gray-100 z-10 min-w-[80px]">Weekday</th>
                <th className="px-2 py-2 text-center border-r border-gray-300 min-w-[60px]">Start</th>
                <th className="px-2 py-2 text-center border-r border-gray-300 min-w-[60px]">On-Site</th>
                <th className="px-2 py-2 text-center border-r border-gray-300 min-w-[60px]">Off-Site</th>
                <th className="px-2 py-2 text-center border-r border-gray-300 min-w-[60px]">Finish</th>
                <th className="px-2 py-2 text-center border-r border-gray-300 min-w-[70px]">Gross Hours</th>
                <th className="px-2 py-2 text-center border-r border-gray-300 min-w-[80px]">Time Lunch Taken</th>
                <th className="px-2 py-2 text-center border-r border-gray-300 min-w-[90px]">Lunch Deduct 0.5 if Y</th>
                <th className="px-2 py-2 text-center border-r border-gray-300 min-w-[90px]">Enter "N" if no claim</th>
                <th className="px-2 py-2 text-center border-r border-gray-300 min-w-[70px]">Net Hours</th>
                <th className="px-2 py-2 text-center border-r border-gray-300 min-w-[80px]">Ordinary Time</th>
                <th className="px-2 py-2 text-center border-r border-gray-300 min-w-[80px]">Overtime x2</th>
                <th className="px-2 py-2 text-center border-r border-gray-300 min-w-[100px]">Lunch Penalty Hours - After 1:30pm</th>
                <th className="px-2 py-2 text-center border-r border-gray-300 min-w-[90px]">Inclement Weather</th>
                <th className="px-2 py-2 text-center border-r border-gray-300 min-w-[80px]">Prod. Allowance</th>
                <th className="px-2 py-2 text-center border-r border-gray-300 min-w-[80px]">Site Allowance</th>
                <th className="px-2 py-2 text-center border-r border-gray-300 min-w-[80px]">Height Allowance</th>
                <th className="px-2 py-2 text-center border-r border-gray-300 min-w-[100px]">Meal Allowance {'>'}= 10 hours</th>
                <th className="px-2 py-2 text-center border-r border-gray-300 min-w-[100px]">Crib Break = or {'>'} 10 hours</th>
                <th className="px-2 py-2 text-center border-r border-gray-300 min-w-[60px]">Travel</th>
                <th className="px-2 py-2 text-center border-r border-gray-300 min-w-[60px]">RDO (Hrs)</th>
                <th className="px-2 py-2 text-center border-r border-gray-300 min-w-[120px]">Personal/Annual Leave & PH's (HRS)</th>
                <th className="px-2 py-2 text-left border-r border-gray-300 min-w-[120px]">Site Name</th>
                <th className="px-2 py-2 text-left min-w-[120px]">Comments</th>
              </tr>
            </thead>
            <tbody>
              {dayRows.map((row, index) => (
                <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-2 py-2 border-r border-gray-200 sticky left-0 bg-white z-10">
                    <div className="font-medium text-gray-900">{row.weekday}</div>
                    <div className="text-[10px] text-gray-600">{row.date}</div>
                  </td>
                  <td className="px-2 py-2 text-center border-r border-gray-200">{row.start}</td>
                  <td className="px-2 py-2 text-center border-r border-gray-200">{row.onSite || ''}</td>
                  <td className="px-2 py-2 text-center border-r border-gray-200">{row.offSite || ''}</td>
                  <td className="px-2 py-2 text-center border-r border-gray-200">{row.finish}</td>
                  <td className="px-2 py-2 text-center border-r border-gray-200 font-medium">{row.grossHours || ''}</td>
                  <td className="px-2 py-2 text-center border-r border-gray-200">{row.timeLunchTaken}</td>
                  <td className="px-2 py-2 text-center border-r border-gray-200">{row.lunchDeduct}</td>
                  <td className="px-2 py-2 text-center border-r border-gray-200">{row.noClaim}</td>
                  <td className="px-2 py-2 text-center border-r border-gray-200 font-medium text-blue-600">{row.netHours || ''}</td>
                  <td className="px-2 py-2 text-center border-r border-gray-200">{row.ordinaryTime || ''}</td>
                  <td className="px-2 py-2 text-center border-r border-gray-200">{row.overtimeX2 || ''}</td>
                  <td className="px-2 py-2 text-center border-r border-gray-200 text-orange-600">{row.lunchPenalty || ''}</td>
                  <td className="px-2 py-2 text-center border-r border-gray-200">{row.inclementWeather}</td>
                  <td className="px-2 py-2 text-center border-r border-gray-200">{row.prodAllowance}</td>
                  <td className="px-2 py-2 text-center border-r border-gray-200">{row.siteAllowance}</td>
                  <td className="px-2 py-2 text-center border-r border-gray-200">{row.heightAllowance}</td>
                  <td className="px-2 py-2 text-center border-r border-gray-200">{row.mealAllowance}</td>
                  <td className="px-2 py-2 text-center border-r border-gray-200">{row.cribBreak}</td>
                  <td className="px-2 py-2 text-center border-r border-gray-200">{row.travel}</td>
                  <td className="px-2 py-2 text-center border-r border-gray-200">{row.rdo}</td>
                  <td className="px-2 py-2 text-center border-r border-gray-200">{row.leaveHours}</td>
                  <td className="px-2 py-2 border-r border-gray-200 text-gray-900">{row.siteName}</td>
                  <td className="px-2 py-2 text-gray-600">{row.comments}</td>
                </tr>
              ))}
              {/* Total Row */}
              <tr className="bg-blue-50 border-t-2 border-blue-300">
                <td className="px-2 py-2 font-medium border-r border-gray-300 sticky left-0 bg-blue-50 z-10">Total</td>
                <td className="px-2 py-2 border-r border-gray-300"></td>
                <td className="px-2 py-2 text-center border-r border-gray-300 font-medium">{totals.onSite.toFixed(1)}</td>
                <td className="px-2 py-2 text-center border-r border-gray-300 font-medium">{totals.offSite.toFixed(1)}</td>
                <td className="px-2 py-2 border-r border-gray-300"></td>
                <td className="px-2 py-2 text-center border-r border-gray-300 font-medium">{totals.grossHours.toFixed(1)}</td>
                <td className="px-2 py-2 border-r border-gray-300"></td>
                <td className="px-2 py-2 border-r border-gray-300"></td>
                <td className="px-2 py-2 border-r border-gray-300"></td>
                <td className="px-2 py-2 text-center border-r border-gray-300 font-medium text-blue-600">{totals.netHours.toFixed(1)}</td>
                <td className="px-2 py-2 text-center border-r border-gray-300 font-medium">{totals.ordinaryTime.toFixed(1)}</td>
                <td className="px-2 py-2 text-center border-r border-gray-300 font-medium">{totals.overtimeX2.toFixed(1)}</td>
                <td className="px-2 py-2 text-center border-r border-gray-300 font-medium text-orange-600">{totals.lunchPenalty > 0 ? totals.lunchPenalty.toFixed(1) : ''}</td>
                <td className="px-2 py-2 border-r border-gray-300"></td>
                <td className="px-2 py-2 border-r border-gray-300"></td>
                <td className="px-2 py-2 border-r border-gray-300"></td>
                <td className="px-2 py-2 border-r border-gray-300"></td>
                <td className="px-2 py-2 border-r border-gray-300"></td>
                <td className="px-2 py-2 border-r border-gray-300"></td>
                <td className="px-2 py-2 border-r border-gray-300"></td>
                <td className="px-2 py-2 border-r border-gray-300"></td>
                <td className="px-2 py-2 border-r border-gray-300"></td>
                <td className="px-2 py-2"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}