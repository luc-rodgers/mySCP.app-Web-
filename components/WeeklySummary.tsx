"use client"
import { TimeEntry, Employee } from '@/lib/types';
import { ArrowLeft, Download, Calendar } from 'lucide-react';
import { Button } from './ui/button';

interface WeeklySummaryProps {
  entries: TimeEntry[];
  employee: Employee;
  onBack: () => void;
}

interface ProjectSlot {
  onSite: string;   // site start time
  offSite: string;  // site finish time
  siteName: string;
}

interface DayRow {
  weekday: string;
  date: string;
  start: string;
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
  comments: string;
  slots: [ProjectSlot, ProjectSlot]; // always exactly 2 slots
}

export function WeeklySummary({ entries, employee, onBack }: WeeklySummaryProps) {
  const today = new Date();
  const currentDay = today.getDay();
  const diff = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  monday.setHours(0, 0, 0, 0);

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date;
  });

  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' });

  const formatDateKey = (date: Date) =>
    date.toISOString().split('T')[0];

  const roundQ = (h: number) => Math.floor(h * 4) / 4;

  const calcHrs = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    return roundQ((eh * 60 + em - sh * 60 - sm) / 60);
  };

  // Get on-site / off-site times for a project entry
  const getProjectSlot = (p: any): ProjectSlot => {
    if (p.type === 'yardwork') {
      return { onSite: p.siteStart || '', offSite: p.siteFinish || '', siteName: p.yardActivity || 'Yard Work' };
    }
    if (p.type === 'leave') {
      return { onSite: '', offSite: '', siteName: p.leaveType || 'Leave' };
    }
    // project type — derive from sub-activities
    const subs = (p.subActivities || []).filter((s: any) => s.start && s.finish);
    if (subs.length === 0) {
      return { onSite: p.siteStart || '', offSite: p.siteFinish || '', siteName: p.project || '' };
    }
    const starts = subs.map((s: any) => s.start).sort();
    const finishes = subs.map((s: any) => s.finish).sort();
    return {
      onSite: starts[0],
      offSite: finishes[finishes.length - 1],
      siteName: p.project || '',
    };
  };

  const emptySlot: ProjectSlot = { onSite: '', offSite: '', siteName: '' };

  const dayRows: DayRow[] = weekDates.map((date, index) => {
    const dateKey = formatDateKey(date);
    const entry = entries.find(e => e.date === dateKey);

    if (!entry || !entry.projects || entry.projects.length === 0) {
      return {
        weekday: weekdays[index],
        date: formatDate(date),
        start: '', finish: '',
        grossHours: 0, timeLunchTaken: '', lunchDeduct: '', noClaim: 'N',
        netHours: 0, ordinaryTime: 0, overtimeX2: 0, lunchPenalty: 0,
        inclementWeather: '', prodAllowance: '', siteAllowance: '',
        heightAllowance: '', mealAllowance: '', cribBreak: '',
        travel: '', rdo: '', leaveHours: '', comments: '',
        slots: [emptySlot, emptySlot],
      };
    }

    const grossHours = calcHrs(entry.depotStart, entry.depotFinish);
    const hasLunch = entry.projects.some(p => p.lunch);
    const hasLunchPenalty = entry.projects.some(p => p.lunchPenalty);
    const lunchPenaltyHours = hasLunchPenalty ? 0.5 : 0;
    const lunchDeduct = hasLunch && !hasLunchPenalty ? 0.5 : 0;
    const netHours = roundQ(grossHours - lunchDeduct - lunchPenaltyHours);
    const ordinaryTime = roundQ(Math.min(netHours, 8));
    const overtimeX2 = roundQ(Math.max(0, netHours - 8));
    const hasWeather = entry.projects.some(p => p.weather);
    const weatherTypes = entry.projects.filter(p => p.weather && p.weatherType).map(p => p.weatherType).join(', ');
    const mealAllowance = grossHours > 10 ? 'Y' : '';
    const cribBreak = grossHours >= 10 ? 'Y' : '';

    const slot0 = entry.projects[0] ? getProjectSlot(entry.projects[0]) : emptySlot;
    const slot1 = entry.projects[1] ? getProjectSlot(entry.projects[1]) : emptySlot;

    return {
      weekday: weekdays[index],
      date: formatDate(date),
      start: entry.depotStart,
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
      prodAllowance: '', siteAllowance: '', heightAllowance: '',
      mealAllowance, cribBreak, travel: '', rdo: '', leaveHours: '', comments: '',
      slots: [slot0, slot1],
    };
  });

  const totals = dayRows.reduce((acc, row) => ({
    grossHours: acc.grossHours + row.grossHours,
    netHours: acc.netHours + row.netHours,
    ordinaryTime: acc.ordinaryTime + row.ordinaryTime,
    overtimeX2: acc.overtimeX2 + row.overtimeX2,
    lunchPenalty: acc.lunchPenalty + row.lunchPenalty,
  }), { grossHours: 0, netHours: 0, ordinaryTime: 0, overtimeX2: 0, lunchPenalty: 0 });

  const weekStart = formatDate(weekDates[0]);
  const weekEnd = formatDate(weekDates[6]);

  const exportToCSV = () => {
    const esc = (v: string | number | undefined | null) => {
      const s = String(v ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const headers = [
      'Weekday', 'Date', 'Start', 'On-Site', 'Off-Site', 'Site Name',
      'Finish', 'Gross Hrs', 'Lunch Taken', 'Lunch Deduct (Y)', 'No Claim (N)',
      'Net Hrs', 'Ord. Time', 'OT x2', 'Lunch Penalty',
      'Inclement Wx', 'Prod Allow.', 'Site Allow.', 'Height Allow.',
      'Meal Allow. ≥10h', 'Crib Break ≥10h', 'Travel', 'RDO (Hrs)', 'Leave (Hrs)', 'Comments',
    ];

    const rows: string[][] = [
      [`Weekly Timesheet Summary`],
      [`Employee`, esc(employee.name), esc(employee.classification)],
      [`Week`, esc(`${weekStart} – ${weekEnd}`)],
      [],
      headers.map(esc),
    ];

    dayRows.forEach(row => {
      // First slot row
      rows.push([
        esc(row.weekday), esc(row.date), esc(row.start),
        esc(row.slots[0].onSite), esc(row.slots[0].offSite), esc(row.slots[0].siteName),
        esc(row.finish), esc(row.grossHours || ''), esc(row.timeLunchTaken),
        esc(row.lunchDeduct), esc(row.noClaim), esc(row.netHours || ''),
        esc(row.ordinaryTime || ''), esc(row.overtimeX2 || ''), esc(row.lunchPenalty || ''),
        esc(row.inclementWeather), esc(row.prodAllowance), esc(row.siteAllowance),
        esc(row.heightAllowance), esc(row.mealAllowance), esc(row.cribBreak),
        esc(row.travel), esc(row.rdo), esc(row.leaveHours), esc(row.comments),
      ]);
      // Second slot row (if has data)
      if (row.slots[1].siteName || row.slots[1].onSite) {
        rows.push([
          '', '', '',
          esc(row.slots[1].onSite), esc(row.slots[1].offSite), esc(row.slots[1].siteName),
          '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
        ]);
      }
    });

    // Totals row
    rows.push([
      'Total', '', '', '', '', '', '',
      esc(totals.grossHours.toFixed(2)), '', '', '',
      esc(totals.netHours.toFixed(2)), esc(totals.ordinaryTime.toFixed(2)),
      esc(totals.overtimeX2.toFixed(2)), esc(totals.lunchPenalty > 0 ? totals.lunchPenalty.toFixed(2) : ''),
      '', '', '', '', '', '', '', '', '', '',
    ]);

    const csv = rows.map(r => r.join(',')).join('\n');
    const safeName = employee.name.replace(/\s+/g, '_');
    const filename = `${safeName}_timesheet_${formatDateKey(weekDates[0])}.csv`;
    const dataUri = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv);
    const a = document.createElement('a');
    a.setAttribute('href', dataUri);
    a.setAttribute('download', filename);
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // shared td class
  const td = "px-2 py-1.5 text-center border-r border-gray-200";
  const tdL = "px-2 py-1.5 text-left border-r border-gray-200";

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <Button onClick={onBack} variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />Back
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={exportToCSV}>
              <Download className="w-4 h-4" />Export
            </Button>
          </div>
          <div>
            <h1 className="text-gray-900 mb-1">Weekly Timesheet Summary</h1>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <Calendar className="w-4 h-4" />
              <span>{weekStart} – {weekEnd}</span>
            </div>
            <div className="text-sm text-gray-900 mt-2">{employee.name} · {employee.classification}</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="px-2 py-2 text-left border-r border-gray-300 sticky left-0 bg-gray-100 z-10 min-w-[80px]" rowSpan={2}>Weekday</th>
                <th className="px-2 py-2 text-center border-r border-gray-300 min-w-[55px]" rowSpan={2}>Start</th>
                <th className="px-2 py-2 text-center border-r border-gray-300 min-w-[55px]">On-Site</th>
                <th className="px-2 py-2 text-center border-r border-gray-300 min-w-[55px]">Off-Site</th>
                <th className="px-2 py-2 text-center border-r border-gray-300 min-w-[100px]">Site Name</th>
                <th className="px-2 py-2 text-center border-r border-gray-300 min-w-[55px]" rowSpan={2}>Finish</th>
                <th className="px-2 py-2 text-center border-r border-gray-300 min-w-[65px]" rowSpan={2}>Gross Hrs</th>
                <th className="px-2 py-2 text-center border-r border-gray-300 min-w-[70px]" rowSpan={2}>Lunch Taken</th>
                <th className="px-2 py-2 text-center border-r border-gray-300 min-w-[80px]" rowSpan={2}>Lunch Deduct (Y)</th>
                <th className="px-2 py-2 text-center border-r border-gray-300 min-w-[80px]" rowSpan={2}>No Claim (N)</th>
                <th className="px-2 py-2 text-center border-r border-gray-300 min-w-[65px]" rowSpan={2}>Net Hrs</th>
                <th className="px-2 py-2 text-center border-r border-gray-300 min-w-[75px]" rowSpan={2}>Ord. Time</th>
                <th className="px-2 py-2 text-center border-r border-gray-300 min-w-[75px]" rowSpan={2}>OT x2</th>
                <th className="px-2 py-2 text-center border-r border-gray-300 min-w-[90px]" rowSpan={2}>Lunch Penalty</th>
                <th className="px-2 py-2 text-center border-r border-gray-300 min-w-[85px]" rowSpan={2}>Inclement Wx</th>
                <th className="px-2 py-2 text-center border-r border-gray-300 min-w-[75px]" rowSpan={2}>Prod Allow.</th>
                <th className="px-2 py-2 text-center border-r border-gray-300 min-w-[75px]" rowSpan={2}>Site Allow.</th>
                <th className="px-2 py-2 text-center border-r border-gray-300 min-w-[75px]" rowSpan={2}>Height Allow.</th>
                <th className="px-2 py-2 text-center border-r border-gray-300 min-w-[90px]" rowSpan={2}>Meal Allow. ≥10h</th>
                <th className="px-2 py-2 text-center border-r border-gray-300 min-w-[90px]" rowSpan={2}>Crib Break ≥10h</th>
                <th className="px-2 py-2 text-center border-r border-gray-300 min-w-[55px]" rowSpan={2}>Travel</th>
                <th className="px-2 py-2 text-center border-r border-gray-300 min-w-[55px]" rowSpan={2}>RDO (Hrs)</th>
                <th className="px-2 py-2 text-center border-r border-gray-300 min-w-[110px]" rowSpan={2}>Leave (Hrs)</th>
                <th className="px-2 py-2 text-left min-w-[120px]" rowSpan={2}>Comments</th>
              </tr>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="px-2 py-2 border-r border-gray-300"></th>
                <th className="px-2 py-2 border-r border-gray-300"></th>
                <th className="px-2 py-2 border-r border-gray-300"></th>
              </tr>
            </thead>
            <tbody>
              {dayRows.map((row, i) => (
                <>
                  {/* Row 1 — project slot 0 */}
                  <tr key={`${i}-a`} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-2 py-1.5 border-r border-gray-200 sticky left-0 bg-white z-10" rowSpan={2}>
                      <div className="font-medium text-gray-900">{row.weekday}</div>
                      <div className="text-[10px] text-gray-500">{row.date}</div>
                    </td>
                    <td className={td} rowSpan={2}>{row.start}</td>
                    <td className={td}>{row.slots[0].onSite}</td>
                    <td className={td}>{row.slots[0].offSite}</td>
                    <td className={tdL}>{row.slots[0].siteName}</td>
                    <td className={td} rowSpan={2}>{row.finish}</td>
                    <td className={`${td} font-medium`} rowSpan={2}>{row.grossHours || ''}</td>
                    <td className={td} rowSpan={2}>{row.timeLunchTaken}</td>
                    <td className={td} rowSpan={2}>{row.lunchDeduct}</td>
                    <td className={td} rowSpan={2}>{row.noClaim}</td>
                    <td className={`${td} font-medium text-blue-600`} rowSpan={2}>{row.netHours || ''}</td>
                    <td className={td} rowSpan={2}>{row.ordinaryTime || ''}</td>
                    <td className={td} rowSpan={2}>{row.overtimeX2 || ''}</td>
                    <td className={`${td} text-orange-600`} rowSpan={2}>{row.lunchPenalty || ''}</td>
                    <td className={td} rowSpan={2}>{row.inclementWeather}</td>
                    <td className={td} rowSpan={2}>{row.prodAllowance}</td>
                    <td className={td} rowSpan={2}>{row.siteAllowance}</td>
                    <td className={td} rowSpan={2}>{row.heightAllowance}</td>
                    <td className={td} rowSpan={2}>{row.mealAllowance}</td>
                    <td className={td} rowSpan={2}>{row.cribBreak}</td>
                    <td className={td} rowSpan={2}>{row.travel}</td>
                    <td className={td} rowSpan={2}>{row.rdo}</td>
                    <td className={td} rowSpan={2}>{row.leaveHours}</td>
                    <td className="px-2 py-1.5 text-gray-600" rowSpan={2}>{row.comments}</td>
                  </tr>
                  {/* Row 2 — project slot 1 */}
                  <tr key={`${i}-b`} className="border-b-2 border-gray-200 hover:bg-gray-50 bg-gray-50/50">
                    <td className={`${td} text-gray-500`}>{row.slots[1].onSite}</td>
                    <td className={`${td} text-gray-500`}>{row.slots[1].offSite}</td>
                    <td className={`${tdL} text-gray-500`}>{row.slots[1].siteName}</td>
                  </tr>
                </>
              ))}

              {/* Totals */}
              <tr className="bg-blue-50 border-t-2 border-blue-300 font-medium" key="totals">
                <td className="px-2 py-2 border-r border-gray-300 sticky left-0 bg-blue-50 z-10" colSpan={1}>Total</td>
                <td className={td}></td>
                <td className={td}></td>
                <td className={td}></td>
                <td className={td}></td>
                <td className={td}></td>
                <td className={`${td} font-bold`}>{totals.grossHours.toFixed(2)}</td>
                <td className={td}></td>
                <td className={td}></td>
                <td className={td}></td>
                <td className={`${td} text-blue-600 font-bold`}>{totals.netHours.toFixed(2)}</td>
                <td className={td}>{totals.ordinaryTime.toFixed(2)}</td>
                <td className={td}>{totals.overtimeX2.toFixed(2)}</td>
                <td className={`${td} text-orange-600`}>{totals.lunchPenalty > 0 ? totals.lunchPenalty.toFixed(2) : ''}</td>
                <td className={td}></td>
                <td className={td}></td>
                <td className={td}></td>
                <td className={td}></td>
                <td className={td}></td>
                <td className={td}></td>
                <td className={td}></td>
                <td className={td}></td>
                <td className={td}></td>
                <td className="px-2 py-2"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
