"use client"
import { Clock, MoreVertical, MoreHorizontal, Plus, Trash2, X, Utensils, CloudRain, Check, CheckCircle, Briefcase, Truck, Plane, Car, Droplet, Hammer, AlertTriangle, ChevronRight, ChevronDown, ChevronUp, SprayCan, Moon, Thermometer, CalendarDays, Wallet } from 'lucide-react';
import { TimeEntry, Project, SubActivity } from '@/lib/types';
import { NON_POURING_WORK_OPTIONS } from '@/lib/activityOptions';
import { diffHours, projectPaidHours, entryTotalHours, addMinutesToTime } from '@/lib/timeMath';
import { useState, useRef, useEffect } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Textarea } from './ui/textarea';
import { FileCheck } from 'lucide-react';
import { TimeCardSummaryModal } from './TimeCardSummaryModal';
import { TimePicker } from './ui/TimePicker';

type ProjectOption = { id: string; name: string };

interface TimeEntryCardProps {
  entry: TimeEntry;
  activeProjects: ProjectOption[];
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TimeEntry['status']) => Promise<boolean>;
  onAddProject: (entryId: string, type?: 'project' | 'yardwork' | 'leave') => void;
  onDeleteProject: (entryId: string, projectId: string) => void;
  onUpdateProject: (entryId: string, projectId: string, updatedProject: Partial<Project>) => void;
  onUpdateEntry: (entryId: string, updatedEntry: Partial<TimeEntry>) => void;
  onAddSubActivity: (entryId: string, projectId: string, type: 'pouring' | 'non-pouring' | 'travel' | 'lunch' | 'yardwork') => void;
  onUpdateSubActivity: (entryId: string, projectId: string, subActivityId: string, updatedSubActivity: Partial<SubActivity>) => void;
  onDeleteSubActivity: (entryId: string, projectId: string, subActivityId: string) => void;
  /** Open the edit modal immediately on mount (e.g. when launched from another page) */
  defaultOpen?: boolean;
  /** Start in view mode even when defaultOpen is true */
  defaultEditMode?: boolean;
  /** Open the summary ticket immediately on mount instead of the edit modal */
  defaultSummaryOpen?: boolean;
  /** Hide the collapsed day-header tile — useful when the card is embedded in a standalone modal */
  hideHeader?: boolean;
  /** Called when the modal is closed — lets parent wrappers know to unmount */
  onModalClose?: () => void;
  /** Projects grouped by state for the QLD/NSW toggle filter */
  projectsByState?: { QLD: ProjectOption[]; NSW: ProjectOption[] };
}

export function TimeEntryCard({ entry, activeProjects, projectsByState, onDelete, onStatusChange, onAddProject, onDeleteProject, onUpdateProject, onUpdateEntry, onAddSubActivity, onUpdateSubActivity, onDeleteSubActivity, defaultOpen = false, defaultEditMode, defaultSummaryOpen = false, hideHeader = false, onModalClose }: TimeEntryCardProps) {
  const [showModal, setShowModal] = useState(defaultOpen);
  const [showSummaryModal, setShowSummaryModal] = useState(defaultSummaryOpen);
  const [isEditMode, setIsEditMode] = useState(defaultEditMode ?? defaultOpen);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditDeleteConfirm, setShowEditDeleteConfirm] = useState(false);
  const [hasBeenEdited, setHasBeenEdited] = useState(false);
  const [wasSubmittedWhenEditStarted, setWasSubmittedWhenEditStarted] = useState(false);
  const [summaryFromEdit, setSummaryFromEdit] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState<'QLD' | 'NSW'>('QLD');
  const [collapsedActivities, setCollapsedActivities] = useState<Set<string>>(new Set());
  const [collapsedWeather, setCollapsedWeather] = useState<Set<string>>(new Set());
  const [moreOpen, setMoreOpen] = useState(false);
  const prevProjectsLengthRef = useRef(entry.projects.length);

  // Auto-open detail modal when a new project is added
  useEffect(() => {
    if (entry.projects.length > prevProjectsLengthRef.current) {
      const lastProject = entry.projects[entry.projects.length - 1];
      if (lastProject) setSelectedProjectId(lastProject.id);
    }
    prevProjectsLengthRef.current = entry.projects.length;
  }, [entry.projects.length]);

  const handleToggleExpanded = () => {
    // Open behaviour is driven purely by status, never by transient edit state:
    // pending/approved always open the review summary; drafts open the editor.
    // (Previously this also checked !isEditMode, so a card edited then closed via
    // the X kept isEditMode=true and re-opened straight into edit — inconsistent.)
    if (entry.status === 'submitted' || entry.status === 'approved') {
      setShowSummaryModal(true);
      return;
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setShowDeleteConfirm(false);
    // Clear edit state so the card returns to its locked review view and the
    // next open is decided solely by status.
    setIsEditMode(false);
    setWasSubmittedWhenEditStarted(false);
    setHasBeenEdited(false);
    onModalClose?.();
  };

  // Mark that edits have been made (used to determine if signature is needed for re-opened cards)
  const markAsEdited = () => {
    if (wasSubmittedWhenEditStarted && !hasBeenEdited) {
      setHasBeenEdited(true);
    }
  };

  // Wrapper functions that mark edits
  const handleUpdateEntry = (entryId: string, updates: Partial<TimeEntry>) => {
    markAsEdited();
    onUpdateEntry(entryId, updates);
  };

  const handleUpdateProject = (entryId: string, projectId: string, updatedProject: Partial<Project>) => {
    markAsEdited();
    onUpdateProject(entryId, projectId, updatedProject);
  };

  const handleAddProject = (entryId: string, type?: 'project' | 'yardwork' | 'leave') => {
    markAsEdited();
    onAddProject(entryId, type);
  };

  const handleDeleteProject = (entryId: string, projectId: string) => {
    markAsEdited();
    onDeleteProject(entryId, projectId);
  };

  const handleAddSubActivity = (entryId: string, projectId: string, type: 'pouring' | 'non-pouring' | 'travel' | 'lunch' | 'yardwork') => {
    // Only one lunch break per day — across every project / yard work on the entry.
    if (type === 'lunch' && entry.projects.some((p) => (p.subActivities || []).some((sa) => sa.type === 'lunch'))) return;
    markAsEdited();
    onAddSubActivity(entryId, projectId, type);
  };

  const handleUpdateSubActivity = (entryId: string, projectId: string, subActivityId: string, updatedSubActivity: Partial<SubActivity>) => {
    markAsEdited();
    onUpdateSubActivity(entryId, projectId, subActivityId, updatedSubActivity);
  };

  const handleDeleteSubActivity = (entryId: string, projectId: string, subActivityId: string) => {
    markAsEdited();
    onDeleteSubActivity(entryId, projectId, subActivityId);
  };

  const calculateLeaveHours = (start: string | undefined, finish: string | undefined) => {
    if (!start || !finish) return 0;
    const [startHour, startMin] = start.split(':').map(Number);
    const [finishHour, finishMin] = finish.split(':').map(Number);
    const hours = (finishHour * 60 + finishMin - startHour * 60 - startMin) / 60;
    const roundToQuarterHour = (hours: number) => Math.floor(hours * 4) / 4;
    return roundToQuarterHour(Math.max(0, hours));
  };
  
  const formatDate = (dateString: string) => {
    // Parse date string as local date to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[date.getDay()];
    const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${dayName}, ${formattedDate}`;
  };

  const getStatusColor = (status: TimeEntry['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-amber-500 text-white';
      case 'submitted':
        return 'bg-[#030213] text-white';
      case 'approved':
        return 'bg-green-500 text-white';
    }
  };

  const hasDraftData = entry.status === 'draft' && (!!entry.depotStart || entry.projects.length > 0);
  const isLeaveOnly = entry.projects.length > 0 && entry.projects.every(p => p.type === 'leave');

  const getStatusLabel = (status: TimeEntry['status']) => {
    if (status === 'submitted') return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const hourOptions = Array.from({ length: 25 }, (_, i) => i * 0.5);

  // Helper function to round down to nearest 0.25 increment
  const roundToQuarterHour = (hours: number) => {
    return Math.floor(hours * 4) / 4;
  };

  // Paid total = on-clock span (sign-on→sign-off) minus lunch, plus leave.
  // Single source of truth: entryTotalHours() in lib/timeMath.
  const totalHours = roundToQuarterHour(entryTotalHours(entry));

  const calculateWeatherHours = (start?: string, end?: string) => {
    if (!start || !end) return 0;
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    const startTotal = startHour + startMin / 60;
    const endTotal = endHour + endMin / 60;
    const hours = Math.max(0, endTotal - startTotal);
    // Round down to nearest 0.25 increment
    return roundToQuarterHour(hours);
  };

  // Check if the entry is locked (submitted but not in edit mode)
  const isLocked = entry.status === 'submitted' && !isEditMode;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border-2 border-gray-200 md:rounded-xl md:flex md:flex-col">
      {/* Day Header - Clickable to open modal */}
      <div
        onClick={handleToggleExpanded}
        className={`relative overflow-hidden transition-colors duration-500 cursor-pointer
          px-4 py-3 flex justify-between items-center
          md:flex-col md:items-center md:justify-between md:px-3 md:py-4 md:min-h-[140px] md:text-center md:flex-1
          ${entry.isNightShift ? 'bg-[#0d1b2a] hover:bg-[#112236]' : 'bg-gray-200 hover:bg-gray-300'}`}
      >
        {/* Night sky stars */}
        {entry.isNightShift && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-2 left-6 w-1 h-1 rounded-full bg-yellow-300 opacity-80" />
            <div className="absolute top-5 left-14 w-0.5 h-0.5 rounded-full bg-yellow-300 opacity-60" />
            <div className="absolute top-2 right-10 w-1 h-1 rounded-full bg-yellow-300 opacity-75" />
            <div className="absolute top-6 right-20 w-0.5 h-0.5 rounded-full bg-yellow-300 opacity-50" />
            <div className="absolute top-1 left-1/3 w-0.5 h-0.5 rounded-full bg-yellow-300 opacity-90" />
            <div className="absolute top-4 left-1/2 w-1 h-1 rounded-full bg-yellow-300 opacity-40" />
            <div className="absolute top-3 right-5 w-0.5 h-0.5 rounded-full bg-yellow-300 opacity-70" />
          </div>
        )}
        {/* Day name + date */}
        <div className="flex items-center gap-3 md:flex-col md:gap-1 md:items-center">
          <Clock className={`w-5 h-5 md:hidden transition-colors duration-500 ${entry.isNightShift ? 'text-blue-200' : 'text-gray-700'}`} />
          <div className="md:text-center">
            <div className={`font-medium md:text-sm transition-colors duration-500 ${entry.isNightShift ? 'text-white' : 'text-gray-900'}`}>
              {/* Mobile: full day name. Desktop: 3-letter abbrev */}
              <span className="md:hidden">{formatDate(entry.date).split(',')[0]}</span>
              <span className="hidden md:inline">{formatDate(entry.date).split(',')[0].slice(0, 3)}</span>
            </div>
            <div className={`text-xs transition-colors duration-500 ${entry.isNightShift ? 'text-blue-300' : 'text-gray-600'}`}>
              {/* Mobile: "Mar 3, 2026". Desktop: just "3 Mar" */}
              <span className="md:hidden">{formatDate(entry.date).split(',')[1]}</span>
              <span className="hidden md:inline">
                {(() => {
                  const [y, m, d] = entry.date.split('-').map(Number);
                  return new Date(y, m - 1, d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
                })()}
              </span>
            </div>
          </div>
        </div>

        {/* Hours */}
        <div className={`text-sm md:text-base md:font-semibold transition-colors duration-500 ${entry.isNightShift ? 'text-white' : 'text-gray-900'}`}>
          {totalHours > 0 ? `${totalHours} hrs` : <span className={`text-xs ${entry.isNightShift ? 'text-blue-300' : 'text-gray-400'}`}>—</span>}
        </div>

        {/* Reference number (submitted cards only) */}
        {entry.timeCardNumber && (
          <div className="text-[10px] text-gray-400 font-mono hidden md:block">{entry.timeCardNumber}</div>
        )}

        {/* Status badge */}
        {entry.status === 'approved' ? (
          <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
        ) : (hasDraftData || entry.status === 'submitted') && (
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}>
            {getStatusLabel(entry.status)}
          </span>
        )}
      </div>


      {/* Summary Modal */}
      <TimeCardSummaryModal
        entry={entry}
        isOpen={showSummaryModal}
        onClose={() => {
          setShowSummaryModal(false);
          if (summaryFromEdit) {
            // Cancel pressed before confirming submit — reopen the edit form
            setSummaryFromEdit(false);
            setShowModal(true);
          } else {
            onModalClose?.();
          }
        }}
        onSubmit={async (signature) => {
          const success = await onStatusChange(entry.id, 'submitted');
          if (success) {
            // Delay closing so the modal's success animation can finish
            setTimeout(() => {
              setShowSummaryModal(false);
              setSummaryFromEdit(false);
              setIsEditMode(false);
              setWasSubmittedWhenEditStarted(false);
              setHasBeenEdited(false);
              // In the editor-modal context (admin pending / profile edit) this
              // closes the editor after a successful submit; no-op inline.
              onModalClose?.();
            }, 1200);
          }
          return success;
        }}
        onEdit={entry.status === 'submitted' ? () => {
          setIsEditMode(true);
          setWasSubmittedWhenEditStarted(true);
          setHasBeenEdited(false);
          setShowSummaryModal(false);
          setShowModal(true);
        } : undefined}
        onDelete={entry.status === 'submitted' ? () => {
          setShowSummaryModal(false);
          onDelete(entry.id);
        } : undefined}
        viewOnly={(entry.status === 'submitted' || entry.status === 'approved') && !isEditMode}
        shouldShowSignature={!wasSubmittedWhenEditStarted || hasBeenEdited}
      />

      {/* Time Card Modal - Full screen mobile, centered overlay desktop */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex flex-col md:items-center md:justify-center">
          {/* Desktop backdrop */}
          <div className="absolute inset-0 bg-black/50 hidden md:block" onClick={handleCloseModal} />
          {/* Panel */}
          <div className="relative bg-white w-full md:max-w-4xl md:rounded-2xl md:shadow-2xl flex flex-col z-10 h-full md:h-auto md:max-h-[95vh]">
          {/* Modal Header */}
          <div className="px-4 py-3 flex justify-between items-center border-b border-gray-200 bg-gray-100 md:rounded-t-2xl shrink-0">
            <div>
              <div className="text-gray-900">{formatDate(entry.date).split(',')[0]}</div>
              <div className="text-xs text-gray-600">{formatDate(entry.date).split(',')[1]}</div>
              {entry.timeCardNumber && (
                <div className="text-[10px] text-gray-400 font-mono mt-0.5">{entry.timeCardNumber}</div>
              )}
            </div>
            {entry.projects.length > 0 && entry.status !== 'draft' && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(entry.status)}`}>
                {getStatusLabel(entry.status)}
              </span>
            )}
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-900">{totalHours} hrs</div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleCloseModal}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="overflow-y-auto p-4" onClick={markAsEdited}>
            {/* Depot Section - Hidden when all projects are leave */}
            {!isLeaveOnly && <div className="mb-4">
              <div className={`border rounded-lg p-4 relative overflow-hidden transition-colors duration-500 ${entry.isNightShift ? 'bg-[#0d1b2a] border-[#1e3a5f]' : 'bg-gray-50'}`}>
                {/* Night sky stars */}
                {entry.isNightShift && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-2 left-6 w-1 h-1 rounded-full bg-yellow-300 opacity-80" />
                    <div className="absolute top-5 left-14 w-0.5 h-0.5 rounded-full bg-yellow-300 opacity-60" />
                    <div className="absolute top-2 right-10 w-1 h-1 rounded-full bg-yellow-300 opacity-75" />
                    <div className="absolute top-6 right-20 w-0.5 h-0.5 rounded-full bg-yellow-300 opacity-50" />
                    <div className="absolute top-1 left-1/3 w-0.5 h-0.5 rounded-full bg-yellow-300 opacity-90" />
                    <div className="absolute top-4 left-1/2 w-1 h-1 rounded-full bg-yellow-300 opacity-40" />
                    <div className="absolute top-3 right-5 w-0.5 h-0.5 rounded-full bg-yellow-300 opacity-70" />
                    <div className="absolute top-7 left-24 w-0.5 h-0.5 rounded-full bg-yellow-300 opacity-55" />
                    <div className="absolute top-1 right-1/3 w-1 h-1 rounded-full bg-yellow-300 opacity-60" />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs mb-1 text-center font-bold transition-colors duration-500 ${entry.isNightShift ? 'text-blue-200' : 'text-gray-600'}`}>Sign On</label>
                    <TimePicker
                      value={entry.depotStart ?? ''}
                      onChange={(v) => handleUpdateEntry(entry.id, { depotStart: v })}
                      disabled={isLocked}
                      className="justify-center"
                    />
                  </div>
                  <div>
                    <label className={`block text-xs mb-1 text-center font-bold transition-colors duration-500 ${entry.isNightShift ? 'text-blue-200' : 'text-gray-600'}`}>Sign Off</label>
                    <TimePicker
                      value={entry.depotFinish ?? ''}
                      onChange={(v) => handleUpdateEntry(entry.id, { depotFinish: v })}
                      disabled={isLocked}
                      className="justify-center"
                    />
                  </div>
                  <div className="hidden">
                    <Input
                      id={`depotHours-mobile-${entry.id}`}
                      type="text"
                      value={diffHours(entry.depotStart, entry.depotFinish, entry.isNightShift).toFixed(2)}
                      className="h-14 bg-white text-center"
                      readOnly
                    />
                  </div>
                </div>
                <div className={`mt-3 pt-3 border-t flex items-center justify-between gap-3 transition-colors duration-500 ${entry.isNightShift ? 'border-white/20' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-2">
                    <Moon className={`w-4 h-4 shrink-0 transition-colors duration-500 ${entry.isNightShift ? 'text-yellow-300' : 'text-gray-500'}`} />
                    <div>
                      <div className={`text-sm font-medium transition-colors duration-500 ${entry.isNightShift ? 'text-white' : 'text-gray-700'}`}>Night Shift</div>
                      {entry.isNightShift && (
                        <div className="text-xs text-blue-300">Sign Off is the next morning</div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={!!entry.isNightShift}
                    onClick={() => handleUpdateEntry(entry.id, { isNightShift: !entry.isNightShift })}
                    disabled={isLocked}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${entry.isNightShift ? 'bg-yellow-400' : 'bg-gray-200'}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${entry.isNightShift ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </div>}

            {/* Projects List - Compact summary cards */}
            {entry.projects.length > 0 && (
              <div className="space-y-2 mb-3">
                {entry.projects.map((project) => {
                  // Paid hours for this row — work activities minus lunch/gaps.
                  const hours = projectPaidHours(project, !!entry.isNightShift);

                  const label = project.type === 'leave'
                    ? (project.leaveType || 'Leave')
                    : project.type === 'yardwork'
                    ? (project.project || 'Yard Work')
                    : (project.project || 'Project');

                  const typeLabel: React.ReactNode = project.type === 'leave' ? 'Leave'
                    : project.type === 'yardwork' ? (
                      <span className="inline-flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 shrink-0" />
                        Yard Work
                      </span>
                    )
                    : (
                      <span className="inline-flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="9" y1="22" x2="9" y2="5" />
                          <line x1="9" y1="5" x2="21" y2="5" />
                          <line x1="9" y1="5" x2="3" y2="5" />
                          <line x1="21" y1="5" x2="21" y2="14" />
                          <path d="M19 14 Q19 17 21 17 Q23 17 23 14" />
                          <line x1="5" y1="22" x2="13" y2="22" />
                          <line x1="3" y1="5" x2="9" y2="3" />
                          <line x1="21" y1="5" x2="9" y2="3" />
                        </svg>
                        Project
                      </span>
                    );

                  return (
                    <button
                      key={project.id}
                      onClick={() => setSelectedProjectId(project.id)}
                      className="w-full flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-left hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div>
                        <div className="text-xs text-gray-400 mb-0.5">{typeLabel}</div>
                        <div className="text-sm font-medium text-gray-900">{label}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{hours > 0 ? `${hours.toFixed(2)} hrs` : '--'}</span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Add Project Buttons */}
            {!isLocked && (
              <p className="text-xs text-gray-400 text-center mt-4 mb-2">Choose the type of work you performed today</p>
            )}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => handleAddProject(entry.id)}
                disabled={isLocked}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-[#030213] hover:bg-[#1a1a2e] text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="9" y1="22" x2="9" y2="5" />
                  <line x1="9" y1="5" x2="21" y2="5" />
                  <line x1="9" y1="5" x2="3" y2="5" />
                  <line x1="21" y1="5" x2="21" y2="14" />
                  <path d="M19 14 Q19 17 21 17 Q23 17 23 14" />
                  <line x1="5" y1="22" x2="13" y2="22" />
                  <line x1="3" y1="5" x2="9" y2="3" />
                  <line x1="21" y1="5" x2="9" y2="3" />
                </svg>
                <span>Project</span>
              </button>
              <button
                onClick={() => handleAddProject(entry.id, 'yardwork')}
                disabled={isLocked}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-[#030213] hover:bg-[#1a1a2e] text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Truck className="w-4 h-4 shrink-0" />
                <span>Yard Work</span>
              </button>
              <button
                onClick={() => handleAddProject(entry.id, 'leave')}
                disabled={isLocked}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-[#030213] hover:bg-[#1a1a2e] text-white text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Plane className="w-4 h-4 shrink-0" />
                <span>Leave</span>
              </button>
            </div>

            {/* Submit Button */}
            {/* Remarks */}
            {!isLocked && (
              <div className="mt-4">
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Comments</label>
                <textarea
                  rows={3}
                  placeholder="Any extra info about today's work..."
                  value={entry.remarks ?? ''}
                  disabled={isLocked}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-form-type="other"
                  onChange={(e) => onUpdateEntry(entry.id, { remarks: e.target.value })}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-gray-200 bg-white text-gray-800 placeholder-gray-400"
                />
              </div>
            )}

            {entry.status !== 'submitted' && entry.status !== 'approved' && (
              <div className="flex flex-col gap-3 mt-4">
                <Button
                  className="w-full !bg-green-600 hover:!bg-green-700 text-white cursor-pointer font-semibold"
                  onClick={() => {
                    // Hide the edit modal and open the review summary WITHOUT calling
                    // onModalClose — in the editor context (admin/profile) that would
                    // unmount the whole editor before the summary could open, so submit
                    // silently did nothing. Keep the card mounted so the summary shows.
                    setShowModal(false);
                    setShowDeleteConfirm(false);
                    setSummaryFromEdit(true);
                    setShowSummaryModal(true);
                  }}
                >
                  <FileCheck className="w-4 h-4 mr-2" />
                  Submit Timesheet
                </Button>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 font-semibold !border-gray-200"
                    onClick={handleCloseModal}
                  >
                    Save Draft
                  </Button>
                  {!isLocked && !showDeleteConfirm && (
                    <Button
                      variant="outline"
                      className="flex-1 font-semibold !border-gray-200 text-red-500 hover:text-red-600"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      Delete Time Card
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Done Editing + Delete — shown only when editing an already
                submitted/approved entry (admin pending review or profile edit).
                Drafts use the Submit / Save Draft / Delete buttons above. */}
            {isEditMode && (entry.status === 'submitted' || entry.status === 'approved') && (
              <div className="flex flex-col gap-3 mt-3">
                <Button
                  className="w-full !bg-green-600 hover:!bg-green-700 text-white cursor-pointer font-semibold"
                  onClick={() => {
                    setIsEditMode(false);
                    setShowModal(false);
                    setSummaryFromEdit(false);
                    setShowSummaryModal(true);
                  }}
                >
                  <FileCheck className="w-4 h-4 mr-2" />
                  Done Editing
                </Button>
                <Button
                  variant="outline"
                  className="w-full font-semibold !border-gray-200 text-red-500 hover:text-red-600"
                  onClick={() => setShowEditDeleteConfirm(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Time Card
                </Button>
              </div>
            )}

            {/* Delete confirmation for the submitted/approved edit view — centered
                overlay so it's never obscured (matches the summary modal's confirm). */}
            {showEditDeleteConfirm && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center px-6 bg-black/40">
                <div className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-2xl space-y-2">
                  <p className="text-base font-semibold text-gray-900 text-center">Delete this time card?</p>
                  <p className="text-xs text-gray-500 text-center pb-1">This can&apos;t be undone.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowEditDeleteConfirm(false)}
                      className="flex-1 text-sm px-3 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => { setShowEditDeleteConfirm(false); handleCloseModal(); onDelete(entry.id); }}
                      className="flex-1 text-sm px-3 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 cursor-pointer font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Delete time card confirm */}
            {!isLocked && showDeleteConfirm && (
              <div className="mt-3 text-center space-y-2">
                <p className="text-sm text-red-700 font-medium">Delete this time card?</p>
                <p className="text-xs text-gray-500">This cannot be undone.</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 cursor-pointer"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                    onClick={() => {
                      handleCloseModal();
                      onDelete(entry.id);
                    }}
                  >
                    Yes, delete
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Layer 2 - Project Detail Modal */}
          {selectedProjectId && (() => {
            const project = entry.projects.find(p => p.id === selectedProjectId);
            if (!project) return null;

            const yardWorkOptions = ['Clean Pump', 'Inspections', 'Maintenance', 'Organize Yard', 'Equipment Prep for Site', 'Deliveries', 'Other'];


            const typeTitle = project.type === 'leave' ? 'Leave'
              : project.type === 'yardwork' ? 'Yard Work'
              : 'Project';

            return (
              <div className="absolute inset-0 z-10 flex flex-col bg-white md:rounded-2xl">
                {/* Layer 2 Header */}
                <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200 bg-gray-50 shrink-0 md:rounded-t-2xl">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedProjectId(null)}
                      className="text-gray-500 hover:text-gray-700 cursor-pointer"
                    >
                      ← Back
                    </button>
                    <span className="text-sm font-medium text-gray-700">|</span>
                    <span className="text-sm font-medium text-gray-900">{typeTitle}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {project.type === 'leave' && totalHours > 0 && (
                      <span className="text-sm font-semibold text-gray-900">{totalHours} hrs</span>
                    )}
                    <button
                      onClick={() => {
                        if (!isLocked) onDeleteProject(entry.id, project.id);
                        setSelectedProjectId(null);
                      }}
                      className="text-red-400 hover:text-red-600 text-xs cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Depot time reference bar — not shown for leave entries */}
                {project.type !== 'leave' && (entry.depotStart || entry.depotFinish) && (
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-center gap-3 shrink-0">
                    <Clock className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                    <span className="text-xs text-gray-400">
                      Sign On: <span className="font-medium text-gray-400">{entry.depotStart || '--'}</span>
                    </span>
                    <span className="text-gray-200">·</span>
                    <span className="text-xs text-gray-400">
                      Sign Off: <span className="font-medium text-gray-400">{entry.depotFinish || '--'}</span>
                    </span>
                  </div>
                )}

                {/* Layer 2 Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">

                  {/* Leave form */}
                  {project.type === 'leave' && (() => {
                    const leaveTypes = [
                      { value: 'Annual Leave', label: 'Annual Leave', Icon: Plane },
                      { value: 'Sick Leave', label: 'Sick Leave', Icon: Thermometer },
                      { value: 'RDO', label: 'RDO', Icon: CalendarDays },
                      { value: 'Unpaid Leave', label: 'Unpaid Leave', Icon: Wallet },
                    ];
                    const selectedType = project.leaveType || '';
                    return (
                      <>
                        <div>
                          <p className="text-xs text-gray-400 text-center mb-3">What kind of leave?</p>
                          <div className="grid grid-cols-2 gap-3">
                            {leaveTypes.map(({ value, label, Icon }) => {
                              const selected = selectedType === value;
                              return (
                                <button
                                  key={value}
                                  type="button"
                                  onClick={() => onUpdateProject(entry.id, project.id, { leaveType: value })}
                                  disabled={isLocked}
                                  className={`flex flex-col items-center justify-center gap-2 px-3 py-4 rounded-xl border text-sm font-medium transition-colors cursor-pointer disabled:opacity-40 ${selected ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'}`}
                                >
                                  <Icon className="w-6 h-6 shrink-0" />
                                  <span>{label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        {selectedType && (
                          <div className="pt-2 flex flex-col items-center">
                            <p className="text-xs text-gray-400 text-center mb-3">How long?</p>
                            <div className="w-32">
                              <Select
                                value={project.leaveTotalHours || ''}
                                className="!h-9 text-sm text-center font-semibold !border-gray-300"
                                onChange={(e) => onUpdateProject(entry.id, project.id, { leaveTotalHours: e.target.value })}
                                disabled={isLocked}
                              >
                                <option value="">Select…</option>
                                {[0.25,0.5,0.75,1,1.25,1.5,1.75,2,2.25,2.5,2.75,3,3.25,3.5,3.75,4,4.25,4.5,4.75,5,5.25,5.5,5.75,6,6.25,6.5,6.75,7,7.25,7.5,7.75,8,8.25,8.5,8.75,9,9.25,9.5,9.75,10,10.25,10.5,10.75,11,11.25,11.5,11.75,12].map(h => (
                                  <option key={h} value={h.toString()}>{h} {h === 1 ? 'hr' : 'hrs'}</option>
                                ))}
                              </Select>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {/* Project / Yard Work form */}
                  {(project.type === 'project' || project.type === 'yardwork') && (
                    <>
                      {project.type === 'project' && (
                        <div className="space-y-3 pt-2">
                          <p className="text-xs text-gray-400 text-center">Choose a project</p>
                          {/* Project dropdown + QLD/NSW toggle */}
                          <div>
                            <label className="block text-xs text-gray-500 mb-1.5">Project Name</label>
                            <div className="flex gap-2 items-center">
                              <Select
                                value={project.projectId || ''}
                                className="flex-1 h-11 text-sm font-semibold cursor-pointer !border !border-gray-300 !bg-white"
                                onChange={(e) => {
                                  const opts = projectsByState
                                    ? (stateFilter === 'QLD' ? projectsByState.QLD : projectsByState.NSW)
                                    : activeProjects;
                                  const found = opts.find(p => p.id === e.target.value);
                                  if (found) onUpdateProject(entry.id, project.id, { project: found.name, projectId: found.id });
                                }}
                                disabled={isLocked}
                              >
                                <option value="">Select Project</option>
                                {(projectsByState
                                  ? (stateFilter === 'QLD' ? projectsByState.QLD : projectsByState.NSW)
                                  : activeProjects
                                ).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </Select>
                              {projectsByState && (
                                <div className="flex bg-gray-100 rounded-lg p-0.5 shrink-0">
                                  {(['QLD', 'NSW'] as const).map(s => (
                                    <button
                                      key={s}
                                      onClick={() => setStateFilter(s)}
                                      className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${stateFilter === s ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                      {s}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Sub-activity cards — shared by project & yard work */}
                      {(project.subActivities || []).length > 0 && (
                        <div className="space-y-3 pt-2">
                              {(project.subActivities || []).map((sa) => {
                                const isTravel = sa.type === 'travel';
                                const isPouring = sa.type === 'pouring';
                                const isLunch = sa.type === 'lunch';
                                const isYardwork = sa.type === 'yardwork';
                                const pouringOptions = ['Mobile', 'Placing Boom / Skid Pump'];
                                const nonPouringOptions = NON_POURING_WORK_OPTIONS;
                                const ActivityIcon = isLunch ? Utensils : isTravel ? Car : isPouring ? Droplet : isYardwork ? Truck : Hammer;
                                const activityLabel = isLunch ? 'Lunch' : isTravel ? 'Travel' : isPouring ? 'Pouring' : isYardwork ? 'Yard Work' : 'Non-Pouring';
                                const isCollapsed = collapsedActivities.has(sa.id);
                                const collapseActivity = () => setCollapsedActivities(prev => new Set([...prev, sa.id]));
                                const expandActivity = () => setCollapsedActivities(prev => { const n = new Set(prev); n.delete(sa.id); return n; });
                                // For a lunch, setting the start auto-fills the finish to 30 min later.
                                const handleStartChange = (v: string) => handleUpdateSubActivity(
                                  entry.id, project.id, sa.id,
                                  isLunch ? { start: v, finish: addMinutesToTime(v, 30) } : { start: v },
                                );

                                return (
                                  <div key={sa.id} className="border border-gray-200 rounded-xl bg-gray-50 overflow-hidden md:rounded-lg">

                                    {/* ── Mobile: collapsed summary row ── */}
                                    {isCollapsed && (
                                      <button
                                        onClick={expandActivity}
                                        className="md:hidden w-full flex items-center gap-2 px-3 py-3 text-left active:bg-gray-100"
                                      >
                                        <ActivityIcon className="w-4 h-4 text-gray-500 shrink-0" />
                                        <span className="text-sm font-medium text-gray-700">{activityLabel}</span>
                                        {sa.activityType && (
                                          <span className="text-sm text-gray-400 truncate">· {sa.activityType}</span>
                                        )}
                                        <div className="ml-auto flex items-center gap-1 text-xs text-gray-500 shrink-0">
                                          <span>{sa.start || '--'}</span>
                                          <span className="text-gray-300">→</span>
                                          <span>{sa.finish || '--'}</span>
                                        </div>
                                        <ChevronDown className="w-4 h-4 text-gray-300 shrink-0 ml-1" />
                                      </button>
                                    )}

                                    {/* ── Full expanded content: always on desktop, conditionally on mobile ── */}
                                    <div className={`p-3 space-y-2 md:p-2 md:space-y-0 md:flex md:items-center md:gap-4 ${isCollapsed ? 'hidden md:flex' : ''}`}>

                                      {/* ── Mobile header: centered label + absolute delete ── */}
                                      <div className="relative flex items-center justify-center md:hidden">
                                        <div className="flex items-center gap-1.5 text-gray-700">
                                          <ActivityIcon className="w-4 h-4" />
                                          <span className="text-sm font-medium">{activityLabel}</span>
                                        </div>
                                        {!isLocked && (
                                          <button onClick={() => handleDeleteSubActivity(entry.id, project.id, sa.id)} className="absolute right-0 text-red-400 hover:text-red-600 cursor-pointer">
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        )}
                                      </div>

                                      {/* ── Desktop label (fixed width) ── */}
                                      <div className="hidden md:flex items-center gap-1 text-gray-600 w-28 shrink-0">
                                        <ActivityIcon className="w-3 h-3 shrink-0" />
                                        <span className="text-xs font-medium">{activityLabel}</span>
                                      </div>

                                      {/* ── Type selector — Travel and Lunch have no type, just a spacer ── */}
                                      {isTravel || isLunch ? (
                                        <div className="hidden md:block md:flex-1" />
                                      ) : isYardwork ? (
                                        <Select
                                          value={sa.activityType || ''}
                                          className="h-10 text-sm w-full md:h-8 md:text-xs md:flex-1 md:min-w-0"
                                          onChange={(e) => handleUpdateSubActivity(entry.id, project.id, sa.id, { activityType: e.target.value })}
                                          disabled={isLocked}
                                        >
                                          <option value="">Select yard work type...</option>
                                          {yardWorkOptions.map(o => <option key={o} value={o}>{o}</option>)}
                                        </Select>
                                      ) : isPouring ? (
                                        <div className="flex rounded-lg border border-gray-200 overflow-hidden w-full md:flex-1 md:min-w-0">
                                          {pouringOptions.map(o => (
                                            <button
                                              key={o}
                                              type="button"
                                              disabled={isLocked}
                                              onClick={() => handleUpdateSubActivity(entry.id, project.id, sa.id, { activityType: sa.activityType === o ? '' : o })}
                                              className={`flex-1 px-2 py-2.5 text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 first:border-r first:border-gray-200 ${sa.activityType === o ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                            >
                                              {o}
                                            </button>
                                          ))}
                                        </div>
                                      ) : (
                                        <Select
                                          value={sa.activityType || ''}
                                          className="h-10 text-sm w-full md:h-8 md:text-xs md:flex-1 md:min-w-0"
                                          onChange={(e) => handleUpdateSubActivity(entry.id, project.id, sa.id, { activityType: e.target.value })}
                                          disabled={isLocked}
                                        >
                                          <option value="">Select type...</option>
                                          {nonPouringOptions.map(o => <option key={o} value={o}>{o}</option>)}
                                        </Select>
                                      )}

                                      {/* ── Start / Finish — mobile: 2-col grid with labels; desktop: compact inline ── */}
                                      <div className="grid grid-cols-2 gap-2 md:hidden">
                                        <div>
                                          <label className="block text-[10px] text-gray-400 mb-1 text-center">Start</label>
                                          <TimePicker value={sa.start || ''} onChange={handleStartChange} disabled={isLocked} className="justify-center" />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] text-gray-400 mb-1 text-center">Finish</label>
                                          <TimePicker value={sa.finish || ''} onChange={(v) => handleUpdateSubActivity(entry.id, project.id, sa.id, { finish: v })} disabled={isLocked} className="justify-center" />
                                        </div>
                                      </div>
                                      <div className="hidden md:flex md:items-center md:gap-4 md:shrink-0">
                                        <div className="flex flex-col items-center gap-0.5">
                                          <span className="text-[10px] text-gray-400">Start</span>
                                          <TimePicker value={sa.start || ''} onChange={handleStartChange} disabled={isLocked} compact />
                                        </div>
                                        <span className="text-gray-300 text-sm mt-3">→</span>
                                        <div className="flex flex-col items-center gap-0.5">
                                          <span className="text-[10px] text-gray-400">Finish</span>
                                          <TimePicker value={sa.finish || ''} onChange={(v) => handleUpdateSubActivity(entry.id, project.id, sa.id, { finish: v })} disabled={isLocked} compact />
                                        </div>
                                      </div>

                                      {/* ── Desktop delete ── */}
                                      {!isLocked && (
                                        <button onClick={() => handleDeleteSubActivity(entry.id, project.id, sa.id)} className="hidden md:block text-red-400 hover:text-red-600 cursor-pointer shrink-0">
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}

                                      {/* ── Mobile: collapse / done button ── */}
                                      {!isLocked && (
                                        <button
                                          onClick={collapseActivity}
                                          className="md:hidden w-full flex items-center justify-center gap-2 py-3 mt-1 rounded-xl bg-gray-900 text-white active:bg-gray-700 cursor-pointer"
                                        >
                                          <Check className="w-5 h-5" />
                                          <span className="text-sm font-medium">Save</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                      {/* Lunch Penalty / Inclement Weather detail boxes */}
                      {project.type === 'project' && (project.lunchPenalty || project.weather) && (
                        <div className="space-y-2">
                          {/* Lunch Penalty detail box */}
                          {project.lunchPenalty && (
                            <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 space-y-2">
                              <div className="flex items-center justify-center gap-1.5 text-gray-700">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="text-sm font-medium">Lunch Penalty</span>
                              </div>
                              <div>
                                <label className="block text-[10px] text-gray-400 mb-1 text-center">What time did you have lunch?</label>
                                <TimePicker
                                  value={project.lunchPenaltyTime || ''}
                                  onChange={(v) => onUpdateProject(entry.id, project.id, { lunchPenaltyTime: v })}
                                  disabled={isLocked}
                                  className="justify-center"
                                />
                              </div>
                            </div>
                          )}

                          {/* Inclement Weather — collapsed summary row */}
                          {project.weather && collapsedWeather.has(project.id) && (
                            <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
                              <button
                                onClick={() => setCollapsedWeather(prev => { const n = new Set(prev); n.delete(project.id); return n; })}
                                className="flex-1 flex items-center gap-2 px-3 py-3 text-left active:bg-gray-100"
                              >
                                <CloudRain className="w-4 h-4 text-gray-500 shrink-0" />
                                <span className="text-sm font-medium text-gray-700">Inclement Weather</span>
                                {project.weatherType && (
                                  <span className="text-sm text-gray-400 truncate">· {project.weatherType}</span>
                                )}
                                <div className="ml-auto flex items-center gap-1 text-xs text-gray-500 shrink-0">
                                  <span>{project.weatherStart || '--'}</span>
                                  <span className="text-gray-300">→</span>
                                  <span>{project.weatherEnd || '--'}</span>
                                </div>
                                <ChevronDown className="w-4 h-4 text-gray-300 shrink-0 ml-1" />
                              </button>
                              {!isLocked && (
                                <button
                                  onClick={() => { onUpdateProject(entry.id, project.id, { weather: false }); setCollapsedWeather(prev => { const n = new Set(prev); n.delete(project.id); return n; }); }}
                                  className="px-3 py-3 text-red-400 hover:text-red-600 active:text-red-700 shrink-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          )}

                          {/* Inclement Weather detail box */}
                          {project.weather && !collapsedWeather.has(project.id) && (
                            <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 space-y-3">
                              <div className="relative flex items-center justify-center gap-1.5 text-gray-700">
                                <CloudRain className="w-4 h-4" />
                                <span className="text-sm font-medium">Inclement Weather</span>
                                {!isLocked && (
                                  <button
                                    onClick={() => { onUpdateProject(entry.id, project.id, { weather: false }); setCollapsedWeather(prev => { const n = new Set(prev); n.delete(project.id); return n; }); }}
                                    className="absolute right-0 text-red-400 hover:text-red-600 cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                              <Select
                                value={project.weatherType || ''}
                                className="h-10 text-sm w-full"
                                onChange={(e) => onUpdateProject(entry.id, project.id, { weatherType: e.target.value })}
                                disabled={isLocked}
                              >
                                <option value="">Select type...</option>
                                <option value="Rain">Rain</option>
                                <option value="Heat">Heat</option>
                                <option value="Air Quality">Air Quality</option>
                                <option value="Other">Other</option>
                              </Select>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] text-gray-400 mb-1 text-center">Start</label>
                                  <TimePicker
                                    value={project.weatherStart || ''}
                                    onChange={(v) => onUpdateProject(entry.id, project.id, { weatherStart: v })}
                                    disabled={isLocked}
                                    className="justify-center"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-gray-400 mb-1 text-center">End</label>
                                  <TimePicker
                                    value={project.weatherEnd || ''}
                                    onChange={(v) => onUpdateProject(entry.id, project.id, { weatherEnd: v })}
                                    disabled={isLocked}
                                    className="justify-center"
                                  />
                                </div>
                              </div>
                              <Input
                                placeholder="Appv By — Enter Name"
                                value={project.approvedBy || ''}
                                onChange={(e) => onUpdateProject(entry.id, project.id, { approvedBy: e.target.value })}
                                disabled={isLocked}
                                className="h-10 text-sm"
                              />
                              {!isLocked && (
                                <button
                                  onClick={() => setCollapsedWeather(prev => new Set([...prev, project.id]))}
                                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-900 text-white active:bg-gray-700 cursor-pointer"
                                >
                                  <Check className="w-5 h-5" />
                                  <span className="text-sm font-medium">Save</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                    </>
                  )}
                </div>

                {/* Sticky activity picker — Travel/Pouring/Non-Pouring + Lunch/Penalty/Weather */}
                {project.type === 'yardwork' && !isLocked && (() => {
                  const hasLunch = entry.projects.some(p => (p.subActivities || []).some(sa => sa.type === 'lunch'));
                  return (
                    <div className="px-4 pt-3 pb-5 border-t border-gray-100 shrink-0 space-y-2 bg-white">
                      <p className="text-xs text-gray-400 text-center">Choose an activity</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleAddSubActivity(entry.id, project.id, 'yardwork')}
                          className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-2 px-2 md:px-3 py-3 md:py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors cursor-pointer"
                        >
                          <Truck className="w-4 h-4 shrink-0" />
                          <span>Yard Work</span>
                        </button>
                        <button
                          onClick={() => handleAddSubActivity(entry.id, project.id, 'lunch')}
                          disabled={isLocked || hasLunch}
                          className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-2 px-2 md:px-3 py-3 md:py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Utensils className="w-4 h-4 shrink-0" />
                          <span>Lunch</span>
                        </button>
                      </div>
                      {hasLunch && <p className="text-[10px] text-gray-400 text-center">Only one lunch break per entry.</p>}
                    </div>
                  );
                })()}

                {project.type === 'project' && !isLocked && (
                  <div className="px-4 pt-3 pb-5 border-t border-gray-100 shrink-0 space-y-2 bg-white">
                    <p className="text-xs text-gray-400 text-center">Choose an activity</p>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleAddSubActivity(entry.id, project.id, 'travel')}
                        className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-2 px-2 md:px-3 py-3 md:py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors cursor-pointer"
                      >
                        <Car className="w-4 h-4 shrink-0" />
                        <span>Travel</span>
                      </button>
                      <button
                        onClick={() => handleAddSubActivity(entry.id, project.id, 'pouring')}
                        className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-2 px-2 md:px-3 py-3 md:py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors cursor-pointer"
                      >
                        <Droplet className="w-4 h-4 shrink-0" />
                        <span>Pouring</span>
                      </button>
                      <button
                        onClick={() => handleAddSubActivity(entry.id, project.id, 'non-pouring')}
                        className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-2 px-2 md:px-3 py-3 md:py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors cursor-pointer"
                      >
                        <Hammer className="w-4 h-4 shrink-0" />
                        <span>Non-Pouring</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleAddSubActivity(entry.id, project.id, 'lunch')}
                        disabled={isLocked || entry.projects.some(p => (p.subActivities || []).some(sa => sa.type === 'lunch'))}
                        className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-2 px-2 md:px-3 py-3 md:py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Utensils className="w-4 h-4 shrink-0" />
                        <span>Lunch</span>
                      </button>
                      <button
                        onClick={() => {
                          if (project.weather && collapsedWeather.has(project.id)) {
                            // Already saved/collapsed — re-expand
                            setCollapsedWeather(prev => { const n = new Set(prev); n.delete(project.id); return n; });
                          } else if (project.weather) {
                            // Turn off weather and clear collapsed state
                            onUpdateProject(entry.id, project.id, { weather: false });
                            setCollapsedWeather(prev => { const n = new Set(prev); n.delete(project.id); return n; });
                          } else {
                            // Turn on and ensure expanded
                            onUpdateProject(entry.id, project.id, { weather: true });
                            setCollapsedWeather(prev => { const n = new Set(prev); n.delete(project.id); return n; });
                          }
                        }}
                        disabled={isLocked}
                        className={`flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-2 px-2 md:px-3 py-3 md:py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 ${project.weather ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'}`}
                      >
                        <CloudRain className="w-4 h-4 shrink-0" />
                        <span className="text-center leading-tight">Inclement<br />Weather</span>
                      </button>
                      <button
                        onClick={() => setMoreOpen(o => !o)}
                        disabled={isLocked}
                        className={`flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-2 px-2 md:px-3 py-3 md:py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 ${moreOpen ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'}`}
                      >
                        <MoreHorizontal className="w-4 h-4 shrink-0" />
                        <span>More</span>
                      </button>
                    </div>
                    {entry.projects.some(p => (p.subActivities || []).some(sa => sa.type === 'lunch')) && (
                      <p className="text-[10px] text-gray-400 text-center">Only one lunch break per entry.</p>
                    )}
                    {moreOpen && (
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => onUpdateProject(entry.id, project.id, { lunchPenalty: !project.lunchPenalty })}
                          disabled={isLocked}
                          className={`flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-2 px-2 md:px-3 py-3 md:py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 ${project.lunchPenalty ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'}`}
                        >
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>Lunch Penalty</span>
                        </button>
                        <button
                          type="button"
                          disabled
                          className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-2 px-2 md:px-3 py-3 md:py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-400 text-xs font-medium cursor-not-allowed opacity-50"
                        >
                          <SprayCan className="w-4 h-4 shrink-0" />
                          <span>Shotcrete</span>
                        </button>
                        <button
                          type="button"
                          disabled
                          className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-2 px-2 md:px-3 py-3 md:py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-400 text-xs font-medium cursor-not-allowed opacity-50"
                        >
                          <Truck className="w-4 h-4 shrink-0" />
                          <span>Transfer KMs</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Layer 2 Footer - total hours + done */}
                <div className="px-4 pt-4 pb-8 border-t border-gray-100 shrink-0 flex items-center gap-4">
                  <div className="flex-1 text-center">
                    <div className="text-xs text-gray-400 mb-0.5">Total</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {`${projectPaidHours(project, !!entry.isNightShift).toFixed(2)} hrs`}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedProjectId(null)}
                    disabled={project.type === 'yardwork' && (() => {
                      const ywActs = (project.subActivities || []).filter(sa => sa.type === 'yardwork');
                      return ywActs.length > 0 ? ywActs.some(a => !a.activityType) : !project.project;
                    })()}
                    className="w-32 h-14 flex items-center justify-center rounded-xl bg-green-600 text-white text-base font-medium active:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>
            );
          })()}

          </div>
        </div>
      )}
    </div>
  );
}