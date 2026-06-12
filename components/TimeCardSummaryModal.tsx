"use client"
import { TimeEntry } from '@/lib/types';
import { diffHours, isTimeOutsideShift, shiftMinutes } from '@/lib/timeMath';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useState } from 'react';
import { ChevronDown, ChevronRight, ChevronLeft, AlertTriangle, Settings, Pencil, Trash2, Moon, ClipboardList, Truck } from 'lucide-react';
import Image from 'next/image';
import { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TimeCardSummaryModalProps {
  entry: TimeEntry;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (signature: string) => Promise<boolean>;
  onEdit?: () => void;
  onDelete?: () => void;
  viewOnly?: boolean;
  shouldShowSignature?: boolean;
}

export function TimeCardSummaryModal({ entry, isOpen, onClose, onSubmit, onEdit, onDelete, viewOnly, shouldShowSignature = true }: TimeCardSummaryModalProps) {
  const [signature, setSignature] = useState('');
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'done'>('idle');
  const [showReviewPrompt, setShowReviewPrompt] = useState(true);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Reset review prompt each time the modal opens
  useEffect(() => {
    if (isOpen) setShowReviewPrompt(true);
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Leave-only entries don't require sign on/off
  const isLeaveOnly = entry.projects.length > 0 && entry.projects.every(p => p.type === 'leave');

  // Check for missing times
  const missingSignOn = !isLeaveOnly && !entry.depotStart;
  const missingSignOff = !isLeaveOnly && !entry.depotFinish;
  const hasMissingTimes = missingSignOn || missingSignOff;

  // Check yard work entries have an activity type selected
  const hasUnselectedYardWork = entry.projects.some(p => p.type === 'yardwork' && !p.project);
  
  // Check for invalid time order (sign on after sign off)
  const hasInvalidTimeOrder = (() => {
    if (entry.isNightShift) return false;
    if (!entry.depotStart || !entry.depotFinish) return false;
    const [startHour, startMin] = entry.depotStart.split(':').map(Number);
    const [finishHour, finishMin] = entry.depotFinish.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const finishMinutes = finishHour * 60 + finishMin;
    return startMinutes >= finishMinutes;
  })();

  // Check if any project/yard work starts outside the shift window
  const hasWorkBeforeSignOn = (() => {
    if (!entry.depotStart || !entry.depotFinish) return false;
    for (const project of entry.projects) {
      if (project.type === 'leave') continue;
      if (project.type === 'yardwork') {
        if (project.siteStart && isTimeOutsideShift(project.siteStart, entry.depotStart, entry.depotFinish, !!entry.isNightShift)) return true;
      } else if (project.type === 'project' && project.subActivities) {
        for (const sa of project.subActivities) {
          if (sa.start && isTimeOutsideShift(sa.start, entry.depotStart, entry.depotFinish, !!entry.isNightShift)) return true;
        }
      }
    }
    return false;
  })();

  // Check if any project/yard work finishes outside the shift window
  const hasWorkAfterSignOff = (() => {
    if (!entry.depotStart || !entry.depotFinish) return false;
    for (const project of entry.projects) {
      if (project.type === 'leave') continue;
      if (project.type === 'yardwork') {
        if (project.siteFinish && isTimeOutsideShift(project.siteFinish, entry.depotStart, entry.depotFinish, !!entry.isNightShift)) return true;
      } else if (project.type === 'project' && project.subActivities) {
        for (const sa of project.subActivities) {
          if (sa.finish && isTimeOutsideShift(sa.finish, entry.depotStart, entry.depotFinish, !!entry.isNightShift)) return true;
        }
      }
    }
    return false;
  })();

  const hasInvalidWorkTimes = hasWorkBeforeSignOn || hasWorkAfterSignOff;

  // True if a sub-activity start sits outside the shift window
  const timeIsBeforeSignOn = (timeString: string) => {
    if (!entry.depotStart || !entry.depotFinish || !timeString) return false;
    return isTimeOutsideShift(timeString, entry.depotStart, entry.depotFinish, !!entry.isNightShift);
  };

  // True if a sub-activity finish sits outside the shift window
  const timeIsAfterSignOff = (timeString: string) => {
    if (!entry.depotStart || !entry.depotFinish || !timeString) return false;
    return isTimeOutsideShift(timeString, entry.depotStart, entry.depotFinish, !!entry.isNightShift);
  };

  // True if a project has any time falling outside the shift window
  const projectHasInvalidTimes = (project: any) => {
    if (!entry.depotStart || !entry.depotFinish) return false;
    const ns = !!entry.isNightShift;
    const outside = (t?: string) => !!t && isTimeOutsideShift(t, entry.depotStart, entry.depotFinish, ns);
    if (project.type === 'yardwork') return outside(project.siteStart) || outside(project.siteFinish);
    if (project.type === 'project' && project.subActivities) {
      return project.subActivities.some((sa: any) => outside(sa.start) || outside(sa.finish));
    }
    return false;
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

  const calculateProjectHours = (project: any) => {
    return diffHours(project.siteStart, project.siteFinish, entry.isNightShift) - (project.lunchPenalty ? 0.5 : 0);
  };

  const calculateWeatherHours = (start?: string, end?: string) => {
    return diffHours(start ?? '', end ?? '', entry.isNightShift);
  };

  const totalHours = (() => {
    if (isLeaveOnly) {
      return entry.projects.reduce((sum, p) => sum + parseFloat((p as any).leaveTotalHours || '0'), 0);
    }
    if (!entry.depotStart || !entry.depotFinish) return 0;
    const hours = diffHours(entry.depotStart, entry.depotFinish, entry.isNightShift);
    const hasLunch = entry.projects.some(project => project.lunch);
    const depotHours = Math.max(0, hours - (hasLunch ? 0.5 : 0));
    const leaveHours = entry.projects
      .filter(p => p.type === 'leave')
      .reduce((sum, p) => sum + parseFloat((p as any).leaveTotalHours || '0'), 0);
    return depotHours + leaveHours;
  })();

  // Calculate total productive hours (project + yard work)
  const totalProductiveHours = (() => {
    let total = 0;
    entry.projects.forEach(project => {
      if (project.type === 'project') {
        if (project.subActivities) {
          project.subActivities.forEach(subActivity => {
            total += diffHours(subActivity.start, subActivity.finish, entry.isNightShift);
          });
        }
      } else if (project.type === 'yardwork') {
        total += calculateProjectHours(project);
      } else if (project.type === 'leave') {
        total += parseFloat((project as any).leaveTotalHours || '0');
      }
    });
    return total;
  })();

  // Calculate non-productive hours
  const nonProductiveHours = Math.max(0, totalHours - totalProductiveHours);

  const handleSubmit = async () => {
    if (!signature.trim() || !onSubmit) return;
    const sig = signature;
    setSignature('');
    setSubmitState('submitting');
    const success = await onSubmit(sig);
    if (success) {
      setSubmitState('done');
      setTimeout(() => setSubmitState('idle'), 1000);
    } else {
      setSignature(sig); // restore so the user can retry
      setSubmitState('idle');
    }
  };

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { setShowSettings(false); setShowDeleteConfirm(false); onClose(); } }}>
      <DialogContent position="top" className="max-w-2xl h-[100dvh] sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden p-0">
        {/* Header — settings gear for view-only, empty bar otherwise */}
        {viewOnly && (onEdit || onDelete) && (
          <DialogHeader className="px-4 pt-3 pb-2 border-b-0 shrink-0">
            <DialogTitle>
              <div className="flex justify-end">
                <div ref={settingsRef} className="relative shrink-0">
                  <button
                    onClick={() => setShowSettings(s => !s)}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  {showSettings && (
                    <div className="absolute right-0 top-10 z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[140px]">
                      {onEdit && (
                        <button
                          onClick={() => { setShowSettings(false); onEdit(); }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                          Edit
                        </button>
                      )}
                      {onDelete && !showDeleteConfirm && (
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      )}
                      {onDelete && showDeleteConfirm && (
                        <div className="px-4 py-2 space-y-2">
                          <p className="text-xs text-red-600 font-medium">Delete this time card?</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setShowDeleteConfirm(false)}
                              className="flex-1 text-xs px-2 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => { setShowSettings(false); setShowDeleteConfirm(false); onDelete(); }}
                              className="flex-1 text-xs px-2 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
        )}

        {/* Review prompt — dismissible overlay, centred over content */}
        {!viewOnly && showReviewPrompt && (
          <div className="absolute inset-0 z-10 flex items-center justify-center px-6">
            <div className="w-full max-w-sm rounded-2xl bg-[#030213] text-white px-6 py-8 flex flex-col items-center gap-6 shadow-2xl">
              <p className="text-xl font-bold text-center leading-snug">Please Review, Confirm and Sign your Time Sheet</p>
              <button
                onClick={() => setShowReviewPrompt(false)}
                className="w-full text-base font-bold bg-white text-[#030213] rounded-xl px-6 py-3 cursor-pointer hover:bg-gray-100"
              >
                Ok
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-4 pt-4 pb-4 px-6">
          {/* Employee Name */}
          <div className="text-center">
            <div className="text-2xl font-bold">{entry.employeeName || 'Employee Name'}</div>
            <div className="text-sm text-gray-500 mt-1">{formatDate(entry.date)}</div>
            {entry.timeCardNumber && (
              <div className="text-xs text-gray-500 mt-1">
                {entry.timeCardNumber}
              </div>
            )}
            {entry.isNightShift && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-medium">
                <Moon className="w-3.5 h-3.5" />
                Night Shift
              </div>
            )}
          </div>

          {/* Sign On / Sign Off / Total Hours - Hidden for leave-only entries */}
          {!isLeaveOnly && <div className={`relative overflow-hidden p-4 rounded-lg border transition-colors duration-500 ${entry.isNightShift ? 'bg-[#0d1b2a] border-[#1e3a5f]' : `bg-gray-50 ${hasMissingTimes && !viewOnly ? 'border-red-400' : 'border-gray-200'}`}`}>
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
            <div className="flex items-center justify-between gap-4">
              <div className="text-center flex-1">
                <div className={`text-xs mb-1 transition-colors duration-500 ${entry.isNightShift ? 'text-blue-200' : 'text-gray-500'}`}>Sign On</div>
                <div className={`text-lg font-semibold transition-colors duration-500 ${missingSignOn && !viewOnly ? 'text-red-600' : entry.isNightShift ? 'text-white' : ''}`}>
                  {entry.depotStart || '--:--'}
                </div>
                {missingSignOn && !viewOnly && (
                  <div className="flex items-center justify-center gap-1 text-xs text-red-600 mt-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Missing</span>
                  </div>
                )}
              </div>
              <div className={`text-xl pb-5 transition-colors duration-500 ${entry.isNightShift ? 'text-blue-300' : 'text-gray-400'}`}>→</div>
              <div className="text-center flex-1">
                <div className={`text-xs mb-1 transition-colors duration-500 ${entry.isNightShift ? 'text-blue-200' : 'text-gray-500'}`}>Sign Off</div>
                <div className={`text-lg font-semibold transition-colors duration-500 ${missingSignOff && !viewOnly ? 'text-red-600' : entry.isNightShift ? 'text-white' : ''}`}>
                  {entry.depotFinish || '--:--'}
                </div>
                {missingSignOff && !viewOnly && (
                  <div className="flex items-center justify-center gap-1 text-xs text-red-600 mt-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Missing</span>
                  </div>
                )}
              </div>
              <div className={`hidden md:block text-2xl mx-2 transition-colors duration-500 ${entry.isNightShift ? 'text-white/20' : 'text-gray-300'}`}>|</div>
              <div className="text-center flex-1">
                <div className={`text-xs mb-1 transition-colors duration-500 ${entry.isNightShift ? 'text-blue-200' : 'text-gray-500'}`}>Total Hours</div>
                <div className={`text-lg font-semibold ${hasInvalidTimeOrder && !viewOnly ? 'text-red-600' : 'text-blue-600'}`}>
                  {totalHours.toFixed(2)}
                </div>
                {hasInvalidTimeOrder && !viewOnly && (
                  <div className="flex items-center justify-center gap-1 text-xs text-red-600 mt-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Invalid</span>
                  </div>
                )}
              </div>
            </div>
          </div>}

          {/* Projects Summary */}
          {entry.projects.length > 0 && (
            <div>
              <div className="space-y-3">
                {entry.projects.map((project, index) => {
                  // Sort sub-activities chronologically by start time.
                  // For night shifts, times before sign-on (e.g. 01:00) wrap to the next day
                  // so they sort *after* late-evening times like 22:00.
                  const ns = !!entry.isNightShift;
                  const signOn = entry.depotStart || '';
                  const sortedSubActivities = project.subActivities
                    ? [...project.subActivities].sort((a, b) => {
                        if (!a.start || !b.start) return 0;
                        return shiftMinutes(a.start, signOn, ns) - shiftMinutes(b.start, signOn, ns);
                      })
                    : [];

                  // Get site start (first pouring/non-pouring activity's start time) and site finish (last pouring/non-pouring activity's finish time)
                  const workActivitiesOnly = sortedSubActivities.filter(sa => sa.type === 'pouring' || sa.type === 'non-pouring');
                  const siteStart = workActivitiesOnly.length > 0 
                    ? workActivitiesOnly[0].start 
                    : project.siteStart || '--:--';
                  const siteFinish = workActivitiesOnly.length > 0 
                    ? workActivitiesOnly[workActivitiesOnly.length - 1].finish 
                    : project.siteFinish || '--:--';

                  // Calculate total project hours from sub-activities
                  const totalProjectHours = sortedSubActivities.reduce((total, subActivity) => {
                    return total + diffHours(subActivity.start, subActivity.finish, ns);
                  }, 0);

                  const weatherHours = calculateWeatherHours(project.weatherStart, project.weatherEnd);
                  
                  // Handle Leave type
                  if (project.type === 'leave') {
                    const leaveHours = parseFloat(project.leaveTotalHours || '0');
                    return (
                      <div key={project.id} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between">
                        <div>
                          <div className="text-xs text-gray-400 mb-0.5">Leave</div>
                          <div className="text-sm font-medium text-gray-900">{project.leaveType || 'Leave'}</div>
                        </div>
                        <span className="text-sm text-gray-500">{leaveHours > 0 ? `${leaveHours.toFixed(2)} hrs` : '--'}</span>
                      </div>
                    );
                  }

                  // Handle RDO type
                  if (project.type === 'rdo') {
                    const rdoHrs = ((parseFloat(project.rdoPayout || '0') + parseFloat(project.rdoHold || '0')));
                    return (
                      <div key={project.id} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between">
                        <div>
                          <div className="text-xs text-gray-400 mb-0.5">Leave</div>
                          <div className="text-sm font-medium text-gray-900">RDO</div>
                        </div>
                        <span className="text-sm text-gray-500">{rdoHrs > 0 ? `${rdoHrs.toFixed(2)} hrs` : '--'}</span>
                      </div>
                    );
                  }

                  // Handle Yard Work type
                  if (project.type === 'yardwork') {
                    const yardWorkHours = calculateProjectHours(project);
                    const isExpanded = expandedProjects[project.id];
                    const hasInvalidTime = !viewOnly && projectHasInvalidTimes(project);
                    const missingYardType = !viewOnly && !project.project;
                    return (
                      <div key={project.id} className={`border rounded-xl overflow-hidden ${hasInvalidTime || missingYardType ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}>
                        <button
                          className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${hasInvalidTime || missingYardType ? 'bg-red-50 hover:bg-red-100' : 'bg-gray-50 hover:bg-gray-100'}`}
                          onClick={() => toggleProject(project.id)}
                        >
                          <div>
                            <div className="text-xs text-gray-400 mb-0.5 flex items-center gap-1">
                              <Truck className="w-3.5 h-3.5 shrink-0" />
                              Yard Work
                              {missingYardType && <span className="text-red-500 ml-1">· Activity required</span>}
                              {hasInvalidTime && !missingYardType && <AlertTriangle className="w-3 h-3 text-red-500 ml-1" />}
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {project.project || 'Yard Work'}
                              {project.lunch && <span className="ml-2 text-xs text-green-600 font-normal">· Lunch</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">{yardWorkHours > 0 ? `${yardWorkHours.toFixed(2)} hrs` : '--'}</span>
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                          </div>
                        </button>

                        {/* Expandable Timeline Details */}
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-3 border-t border-gray-200">
                            <div className="relative">
                              <div className="flex items-start mb-2">
                                <div className="flex items-center mr-3 relative z-10">
                                  <div className="w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow"></div>
                                </div>
                                <div className="text-sm">
                                  <span className="text-gray-500">Site Start:</span> <span className={`font-semibold ${hasInvalidTime ? 'text-red-600' : ''}`}>{project.siteStart || '--:--'}</span>
                                </div>
                              </div>
                              {project.project && (
                                <div className="relative">
                                  <div className="absolute left-1.5 top-0 bottom-0 w-0.5 bg-gray-300"></div>
                                  <div className="ml-6 mb-2">
                                    <div className="relative">
                                      <div className="absolute -left-6 top-2 w-3 h-3 rounded-full bg-white border-2 border-gray-300"></div>
                                      <div className="p-2 rounded bg-yellow-50 border border-yellow-200">
                                        <div className="text-xs font-semibold mb-1">Yard Work Activity</div>
                                        <div className="text-xs text-gray-700">{project.project}</div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                              <div className="flex items-start">
                                <div className="flex items-center mr-3 relative z-10">
                                  <div className="w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow"></div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="text-sm">
                                    <span className="text-gray-500">Site Finish:</span> <span className={`font-semibold ${!viewOnly && timeIsAfterSignOff(project.siteFinish) ? 'text-red-600' : ''}`}>{project.siteFinish || '--:--'}</span>
                                  </div>
                                  {!viewOnly && project.siteFinish && timeIsAfterSignOff(project.siteFinish) && <AlertTriangle className="w-3.5 h-3.5 text-red-600" />}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Handle Project type with timeline
                  const isExpanded = expandedProjects[project.id];
                  const hasInvalidTime = !viewOnly && projectHasInvalidTimes(project);

                  return (
                    <div key={project.id} className={`border rounded-xl overflow-hidden ${hasInvalidTime ? 'border-red-400' : 'border-gray-200'}`}>
                      {/* Collapsed header */}
                      <button
                        className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${hasInvalidTime ? 'bg-red-50 hover:bg-red-100' : 'bg-gray-50 hover:bg-gray-100'}`}
                        onClick={() => toggleProject(project.id)}
                      >
                        <div>
                          <div className="text-xs text-gray-400 mb-0.5 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="9" y1="22" x2="9" y2="5" /><line x1="9" y1="5" x2="21" y2="5" />
                              <line x1="9" y1="5" x2="3" y2="5" /><line x1="21" y1="5" x2="21" y2="14" />
                              <path d="M19 14 Q19 17 21 17 Q23 17 23 14" />
                              <line x1="5" y1="22" x2="13" y2="22" /><line x1="3" y1="5" x2="9" y2="3" />
                              <line x1="21" y1="5" x2="9" y2="3" />
                            </svg>
                            Project
                            {hasInvalidTime && <AlertTriangle className="w-3 h-3 text-red-500 ml-1" />}
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {project.project || <span className="text-red-600">Unknown Project</span>}
                            {project.lunch && <span className="ml-2 text-xs text-green-600 font-normal">· Lunch</span>}
                            {project.weather && <span className="ml-2 text-xs text-orange-600 font-normal">· Weather ({weatherHours.toFixed(1)} hrs)</span>}
                            {project.lunchPenalty && <span className="ml-2 text-xs text-orange-600 font-normal">· Lunch Penalty</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">{totalProjectHours > 0 ? `${totalProjectHours.toFixed(2)} hrs` : '--'}</span>
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                        </div>
                      </button>
                      
                      {/* Expandable Timeline Details */}
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t">
                          {/* Timeline container */}
                          <div className="relative mt-3">
                            {/* Activities with connecting line */}
                            {sortedSubActivities.length > 0 && (
                              <div className="relative">
                                {/* Vertical line */}
                                <div className="absolute left-1.5 top-0 bottom-0 w-0.5 bg-gray-300"></div>
                                
                                {/* Activities */}
                                <div className="space-y-3 ml-6 mb-2">
                                  {sortedSubActivities.map((subActivity, idx) => {
                                    const subActivityHours = diffHours(subActivity.start, subActivity.finish, ns);
                                    
                                    // Determine if this is the first or last work activity (non-travel)
                                    const workActivities = sortedSubActivities.filter(sa => sa.type !== 'travel');
                                    const isFirstWorkActivity = workActivities.length > 0 && subActivity.id === workActivities[0].id;
                                    const isLastWorkActivity = workActivities.length > 0 && subActivity.id === workActivities[workActivities.length - 1].id;
                                    
                                    return (
                                      <div key={subActivity.id}>
                                        {/* Show Site Start node before first work activity */}
                                        {isFirstWorkActivity && siteStart && (
                                          <div className="flex items-start mb-3">
                                            <div className="flex items-center mr-3 -ml-6 relative z-10">
                                              <div className="w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow"></div>
                                            </div>
                                            <div className="text-sm">
                                              <span className="text-gray-500">Site Start:</span> <span className="font-semibold">{siteStart}</span>
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* Activity box */}
                                        <div className="relative">
                                          {/* Dot connector */}
                                          <div className="absolute -left-6 top-2 w-3 h-3 rounded-full bg-white border-2 border-gray-300"></div>
                                          
                                          {/* Activity details */}
                                          <div className={`p-2 rounded ${
                                            subActivity.type === 'pouring' 
                                              ? 'bg-green-50 border border-green-200' 
                                              : subActivity.type === 'travel'
                                              ? 'bg-purple-50 border border-purple-200'
                                              : 'bg-blue-50 border border-blue-200'
                                          }`}>
                                            <div className="text-xs font-semibold mb-1">
                                              {subActivity.type === 'pouring' 
                                                ? 'Pouring Work'
                                                : subActivity.type === 'travel'
                                                ? 'Travel To/From'
                                                : 'Non-Pouring Work'}
                                            </div>
                                            {subActivity.type !== 'travel' && (
                                              <div className="text-xs text-gray-700 mb-1">
                                                {subActivity.activityType || 'Not specified'}
                                              </div>
                                            )}
                                            <div className="flex justify-between items-center text-xs text-gray-600">
                                              <div className="flex items-center gap-2">
                                                <div>
                                                  <span className="text-gray-500">Start:</span> <span className={!viewOnly && timeIsBeforeSignOn(subActivity.start) ? 'text-red-600 font-semibold' : ''}>{subActivity.start || '--:--'}</span>
                                                  <span className="mx-2">→</span>
                                                  <span className="text-gray-500">End:</span> <span className={!viewOnly && timeIsAfterSignOff(subActivity.finish) ? 'text-red-600 font-semibold' : ''}>{subActivity.finish || '--:--'}</span>
                                                </div>
                                                {!viewOnly && subActivity.start && timeIsBeforeSignOn(subActivity.start) && (
                                                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                                                )}
                                                {!viewOnly && subActivity.finish && timeIsAfterSignOff(subActivity.finish) && (
                                                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                                                )}
                                              </div>
                                              <div className="text-blue-600 font-semibold">
                                                {subActivityHours.toFixed(2)} hrs
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        {/* Show Site Finish node after last work activity */}
                                        {isLastWorkActivity && siteFinish && (
                                          <div className="flex items-start mt-3">
                                            <div className="flex items-center mr-3 -ml-6 relative z-10">
                                              <div className="w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow"></div>
                                            </div>
                                            <div className="text-sm">
                                              <span className="text-gray-500">Site Finish:</span> <span className="font-semibold">{siteFinish}</span>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Weather Details */}
                          {project.weather && (
                            <div className="mt-3 pt-3 border-t border-orange-200 bg-orange-50 -mx-4 -mb-4 px-4 pb-3 rounded-b-lg text-xs">
                              <div className="grid grid-cols-2 gap-2 text-gray-700">
                                <div><span className="text-gray-500">Type:</span> {project.weatherType || 'Not specified'}</div>
                                <div><span className="text-gray-500">Approved By:</span> {project.approvedBy || 'Not specified'}</div>
                                <div><span className="text-gray-500">Start:</span> {project.weatherStart || '--:--'}</div>
                                <div><span className="text-gray-500">End:</span> {project.weatherEnd || '--:--'}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Non-Productive Work Section */}
          {nonProductiveHours > 0 && (
            <div>
              <div className="border border-rose-200 rounded-lg p-4 bg-rose-50">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <div className="text-base font-bold text-gray-700">Non-Allocated Paid Time</div>
                    <div className="text-xs text-gray-600 mt-1">
                      Time not allocated to an activity, yard work or project
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-bold text-gray-700 whitespace-nowrap">{nonProductiveHours.toFixed(2)} hrs</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Remarks Section */}
          {entry.remarks && entry.remarks.trim() && (
            <div className="border rounded-lg bg-white overflow-hidden">
              <div
                className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleProject('__remarks__')}
              >
                <div className="flex items-center gap-2">
                  {expandedProjects['__remarks__'] ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                  <div className="text-base font-bold">Comments</div>
                </div>
              </div>
              {expandedProjects['__remarks__'] && (
                <div className="px-4 pb-4 pt-0">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{entry.remarks}</p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Pinned footer — signature + actions always visible */}
        <div className="shrink-0 border-t bg-white px-6 pt-4 pb-6 space-y-3">
          {!viewOnly && shouldShowSignature && (
            <div>
              <p className="text-lg font-bold text-gray-900 mb-2 text-center">Type Initials or Signature Below</p>
              <Input
                id="signature"
                type="text"
                placeholder="Enter your initials or full name"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                className="h-11 border-2 border-blue-400 bg-blue-50 focus:border-blue-500 focus:bg-white text-base"
              />
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              {viewOnly ? 'Close' : (
                <><ChevronLeft className="w-4 h-4 mr-1" />Back & Edit</>
              )}
            </Button>
            {!viewOnly && onSubmit && (
              <Button
                onClick={handleSubmit}
                disabled={(shouldShowSignature && !signature.trim()) || hasMissingTimes || hasInvalidTimeOrder || hasInvalidWorkTimes || hasUnselectedYardWork || submitState !== 'idle'}
                className="flex-1 !bg-green-600 hover:!bg-green-700 text-white font-bold"
              >
                Accept & Submit
              </Button>
            )}
          </div>
        </div>

      </DialogContent>

      {/* Submit feedback overlay — rendered in a portal so re-renders can't reset it */}
      {submitState !== 'idle' && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-sm">
          {submitState === 'submitting' ? (
            <div className="w-14 h-14 border-4 border-gray-200 border-t-[#030213] rounded-full animate-spin" />
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
                <svg className="w-9 h-9 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-medium text-green-600">Submitted!</p>
            </div>
          )}
        </div>,
        document.body
      )}
    </Dialog>
  );
}