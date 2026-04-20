"use client"
import { TimeEntry } from '@/lib/types';
import { TimeEntryCard } from './TimeEntryCard';
import { Button } from './ui/button';
import { FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

type ProjectOption = { id: string; name: string };

interface TimeEntryListProps {
  entries: TimeEntry[];
  activeProjects: ProjectOption[];
  projectsByState?: { QLD: ProjectOption[]; NSW: ProjectOption[] };
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TimeEntry['status']) => void;
  onAddProject: (entryId: string, type?: 'project' | 'yardwork' | 'leave') => void;
  onDeleteProject: (entryId: string, projectId: string) => void;
  onUpdateProject: (entryId: string, projectId: string, updatedProject: any) => void;
  onUpdateEntry: (entryId: string, updatedEntry: Partial<TimeEntry>) => void;
  onViewWeeklySummary: () => void;
  onAddSubActivity: (entryId: string, projectId: string, type: string) => void;
  onUpdateSubActivity: (entryId: string, projectId: string, subActivityId: string, updatedSubActivity: any) => void;
  onDeleteSubActivity: (entryId: string, projectId: string, subActivityId: string) => void;
  /** YYYY-MM-DD — jump straight to the week containing this date */
  initialDate?: string;
}

/** Return the number of whole weeks between today's Monday and the Monday of the week containing targetDate */
function weekOffsetForDate(targetDateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDay = today.getDay();
  const todayMonday = new Date(today);
  todayMonday.setDate(today.getDate() + (todayDay === 0 ? -6 : 1 - todayDay));

  const [y, m, d] = targetDateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const targetDay = target.getDay();
  const targetMonday = new Date(target);
  targetMonday.setDate(target.getDate() + (targetDay === 0 ? -6 : 1 - targetDay));

  return Math.round((targetMonday.getTime() - todayMonday.getTime()) / (7 * 24 * 60 * 60 * 1000));
}

export function TimeEntryList({ entries, activeProjects, projectsByState, onDelete, onStatusChange, onAddProject, onDeleteProject, onUpdateProject, onUpdateEntry, onViewWeeklySummary, onAddSubActivity, onUpdateSubActivity, onDeleteSubActivity, initialDate }: TimeEntryListProps) {
  // Track week offset (0 = current week, -1 = previous week, +1 = next week, etc.)
  const [weekOffset, setWeekOffset] = useState(() => initialDate ? weekOffsetForDate(initialDate) : 0);

  // Get current week date range (Monday to Sunday)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  // Calculate the base date for the selected week
  const baseDate = new Date(today);
  baseDate.setDate(today.getDate() + (weekOffset * 7));
  
  // Get Monday of the week
  const day = baseDate.getDay();
  const diff = day === 0 ? -6 : 1 - day; // If Sunday (0), go back 6 days; otherwise go to Monday
  const weekStart = new Date(baseDate);
  weekStart.setDate(baseDate.getDate() + diff);
  weekStart.setHours(0, 0, 0, 0);
  
  // Calculate Sunday as end of week
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  // Create array of all 7 days in the week starting with Monday
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const weekDays = dayNames.map((name, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    // Use local date formatting to avoid timezone issues with toISOString
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    return {
      name,
      date,
      dateString
    };
  });
  
  // Group entries by date
  const entriesByDate = entries.reduce((acc, entry) => {
    const date = entry.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, TimeEntry[]>);

  const formatWeekRange = () => {
    const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endFormatted = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startMonth} - ${endFormatted}`;
  };

  return (
    <div className="mx-4 pb-24 md:mx-0 md:pb-6">
      <div className="flex items-center justify-center gap-3 mb-4 bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 cursor-pointer"
          onClick={() => setWeekOffset(weekOffset - 1)}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <p className="text-gray-700 text-sm font-medium text-center min-w-[200px]">{formatWeekRange()}</p>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 cursor-pointer"
          onClick={() => setWeekOffset(weekOffset + 1)}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
      
      <div className="space-y-4 md:grid md:grid-cols-7 md:gap-2 md:space-y-0">
        {weekDays.map((day) => {
          const dayEntries = entriesByDate[day.dateString] || [];

          // Use the real entry if one exists, otherwise a stable placeholder.
          // Always use key={day.dateString} so React keeps the same TimeEntryCard
          // instance when an entry transitions from placeholder → real — this
          // preserves the open-modal state and prevents the card from closing.
          const entry: TimeEntry = dayEntries[0] ?? {
            id: `placeholder-${day.dateString}`,
            date: day.dateString,
            status: 'draft',
            depotStart: '',
            depotFinish: '',
            projects: [],
          };

          const isToday = day.dateString === todayString;

          return (
            <div key={day.dateString} className={isToday ? 'rounded-xl ring-2 ring-[#030213] ring-offset-2' : ''}>
              <TimeEntryCard
                key={day.dateString}
                entry={entry}
                activeProjects={activeProjects}
                projectsByState={projectsByState}
                onDelete={onDelete}
                onStatusChange={onStatusChange}
                onAddProject={onAddProject}
                onDeleteProject={onDeleteProject}
                onUpdateProject={onUpdateProject}
                onUpdateEntry={onUpdateEntry}
                onAddSubActivity={onAddSubActivity}
                onUpdateSubActivity={onUpdateSubActivity}
                onDeleteSubActivity={onDeleteSubActivity}
              />
            </div>
          );
        })}
      </div>
      
      <div className="mt-6">
        <Button
          onClick={onViewWeeklySummary}
          variant="secondary"
          size="sm"
          className="w-full gap-2 cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          View Weekly Summary
        </Button>
      </div>
    </div>
  );
}