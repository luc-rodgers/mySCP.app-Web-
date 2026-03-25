"use client"
import { TimeEntry } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useState } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle, Settings, Pencil, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TimeCardSummaryModalProps {
  entry: TimeEntry;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (signature: string) => void;
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
  const settingsRef = useRef<HTMLDivElement>(null);

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

  // Check for missing times
  const missingSignOn = !entry.depotStart;
  const missingSignOff = !entry.depotFinish;
  const hasMissingTimes = missingSignOn || missingSignOff;

  // Check yard work entries have an activity type selected
  const hasUnselectedYardWork = entry.projects.some(p => p.type === 'yardwork' && !p.project);
  
  // Check for invalid time order (sign on after sign off)
  const hasInvalidTimeOrder = (() => {
    if (!entry.depotStart || !entry.depotFinish) return false;
    const [startHour, startMin] = entry.depotStart.split(':').map(Number);
    const [finishHour, finishMin] = entry.depotFinish.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const finishMinutes = finishHour * 60 + finishMin;
    return startMinutes >= finishMinutes;
  })();

  // Check if any project/yard work starts before sign on time
  const hasWorkBeforeSignOn = (() => {
    if (!entry.depotStart) return false;
    const [signOnHour, signOnMin] = entry.depotStart.split(':').map(Number);
    const signOnMinutes = signOnHour * 60 + signOnMin;

    for (const project of entry.projects) {
      if (project.type === 'leave') continue; // Skip Leave

      if (project.type === 'yardwork') {
        // Check yard work site start
        if (project.siteStart) {
          const [startHour, startMin] = project.siteStart.split(':').map(Number);
          const startMinutes = startHour * 60 + startMin;
          if (startMinutes < signOnMinutes) return true;
        }
      } else if (project.type === 'project' && project.subActivities) {
        // Check all sub-activity start times
        for (const subActivity of project.subActivities) {
          if (subActivity.start) {
            const [startHour, startMin] = subActivity.start.split(':').map(Number);
            const startMinutes = startHour * 60 + startMin;
            if (startMinutes < signOnMinutes) return true;
          }
        }
      }
    }
    return false;
  })();

  // Check if any project/yard work finishes after sign off time
  const hasWorkAfterSignOff = (() => {
    if (!entry.depotFinish) return false;
    const [signOffHour, signOffMin] = entry.depotFinish.split(':').map(Number);
    const signOffMinutes = signOffHour * 60 + signOffMin;

    for (const project of entry.projects) {
      if (project.type === 'leave') continue; // Skip Leave

      if (project.type === 'yardwork') {
        // Check yard work site finish
        if (project.siteFinish) {
          const [finishHour, finishMin] = project.siteFinish.split(':').map(Number);
          const finishMinutes = finishHour * 60 + finishMin;
          if (finishMinutes > signOffMinutes) return true;
        }
      } else if (project.type === 'project' && project.subActivities) {
        // Check all sub-activity finish times
        for (const subActivity of project.subActivities) {
          if (subActivity.finish) {
            const [finishHour, finishMin] = subActivity.finish.split(':').map(Number);
            const finishMinutes = finishHour * 60 + finishMin;
            if (finishMinutes > signOffMinutes) return true;
          }
        }
      }
    }
    return false;
  })();

  const hasInvalidWorkTimes = hasWorkBeforeSignOn || hasWorkAfterSignOff;

  // Helper function to check if a specific start time is before sign on
  const timeIsBeforeSignOn = (timeString: string) => {
    if (!entry.depotStart || !timeString) return false;
    const [signOnHour, signOnMin] = entry.depotStart.split(':').map(Number);
    const signOnMinutes = signOnHour * 60 + signOnMin;
    
    const [timeHour, timeMin] = timeString.split(':').map(Number);
    const timeMinutes = timeHour * 60 + timeMin;
    
    return timeMinutes < signOnMinutes;
  };

  // Helper function to check if a specific finish time is after sign off
  const timeIsAfterSignOff = (timeString: string) => {
    if (!entry.depotFinish || !timeString) return false;
    const [signOffHour, signOffMin] = entry.depotFinish.split(':').map(Number);
    const signOffMinutes = signOffHour * 60 + signOffMin;
    
    const [timeHour, timeMin] = timeString.split(':').map(Number);
    const timeMinutes = timeHour * 60 + timeMin;
    
    return timeMinutes > signOffMinutes;
  };

  // Helper function to check if a specific project has times before sign on or after sign off
  const projectHasInvalidTimes = (project: any) => {
    // Check start times before sign on
    if (entry.depotStart) {
      const [signOnHour, signOnMin] = entry.depotStart.split(':').map(Number);
      const signOnMinutes = signOnHour * 60 + signOnMin;

      if (project.type === 'yardwork') {
        if (project.siteStart) {
          const [startHour, startMin] = project.siteStart.split(':').map(Number);
          const startMinutes = startHour * 60 + startMin;
          if (startMinutes < signOnMinutes) return true;
        }
      } else if (project.type === 'project' && project.subActivities) {
        for (const subActivity of project.subActivities) {
          if (subActivity.start) {
            const [startHour, startMin] = subActivity.start.split(':').map(Number);
            const startMinutes = startHour * 60 + startMin;
            if (startMinutes < signOnMinutes) return true;
          }
        }
      }
    }

    // Check finish times after sign off
    if (entry.depotFinish) {
      const [signOffHour, signOffMin] = entry.depotFinish.split(':').map(Number);
      const signOffMinutes = signOffHour * 60 + signOffMin;

      if (project.type === 'yardwork') {
        if (project.siteFinish) {
          const [finishHour, finishMin] = project.siteFinish.split(':').map(Number);
          const finishMinutes = finishHour * 60 + finishMin;
          if (finishMinutes > signOffMinutes) return true;
        }
      } else if (project.type === 'project' && project.subActivities) {
        for (const subActivity of project.subActivities) {
          if (subActivity.finish) {
            const [finishHour, finishMin] = subActivity.finish.split(':').map(Number);
            const finishMinutes = finishHour * 60 + finishMin;
            if (finishMinutes > signOffMinutes) return true;
          }
        }
      }
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
    if (!project.siteStart || !project.siteFinish) return 0;
    const [startHour, startMin] = project.siteStart.split(':').map(Number);
    const [finishHour, finishMin] = project.siteFinish.split(':').map(Number);
    return (finishHour * 60 + finishMin - startHour * 60 - startMin) / 60 - (project.lunchPenalty ? 0.5 : 0);
  };

  const calculateWeatherHours = (start?: string, end?: string) => {
    if (!start || !end) return 0;
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    return Math.max(0, (endHour * 60 + endMin - startHour * 60 - startMin) / 60);
  };

  const totalHours = (() => {
    if (!entry.depotStart || !entry.depotFinish) return 0;
    const [depotStartHour, depotStartMin] = entry.depotStart.split(':').map(Number);
    const [depotFinishHour, depotFinishMin] = entry.depotFinish.split(':').map(Number);
    const hours = (depotFinishHour * 60 + depotFinishMin - depotStartHour * 60 - depotStartMin) / 60;
    const hasLunch = entry.projects.some(project => project.lunch);
    return Math.max(0, hours - (hasLunch ? 0.5 : 0));
  })();

  // Calculate total productive hours (project + yard work)
  const totalProductiveHours = (() => {
    let total = 0;
    entry.projects.forEach(project => {
      if (project.type === 'project') {
        // For projects, sum all sub-activity hours
        if (project.subActivities) {
          project.subActivities.forEach(subActivity => {
            if (subActivity.start && subActivity.finish) {
              const [startHour, startMin] = subActivity.start.split(':').map(Number);
              const [finishHour, finishMin] = subActivity.finish.split(':').map(Number);
              total += (finishHour * 60 + finishMin - startHour * 60 - startMin) / 60;
            }
          });
        }
      } else if (project.type === 'yardwork') {
        // For yard work, use siteStart and siteFinish
        total += calculateProjectHours(project);
      }
      // RDO type doesn't count toward productive hours
    });
    return total;
  })();

  // Calculate non-productive hours
  const nonProductiveHours = Math.max(0, totalHours - totalProductiveHours);

  const handleSubmit = () => {
    if (signature.trim() && onSubmit) {
      const sig = signature;
      setSignature('');
      setSubmitState('submitting');
      setTimeout(() => {
        setSubmitState('done');
        setTimeout(() => {
          setSubmitState('idle');
          onSubmit(sig); // call AFTER animation so no re-render interrupts
        }, 1000);
      }, 800);
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="px-4 pt-4 pb-0 border-b-0">
          <DialogTitle asChild>
            <div className="flex items-center justify-between">
              {/* Left spacer — same width as gear button so logo stays centred */}
              <div className="w-8 shrink-0" />

              {/* Logo */}
              <Image
                src="/scp-corporate-logo.jpg"
                alt="Specialised Concrete Pumping"
                width={140}
                height={56}
                className="object-contain"
                priority
              />

              {/* Settings gear — top right */}
              {viewOnly && (onEdit || onDelete) ? (
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
              ) : (
                <div className="w-8 shrink-0" />
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4 pb-4 px-6">
          {/* Employee Name */}
          <div className="text-center">
            <div className="text-2xl font-bold">{entry.employeeName || 'Employee Name'}</div>
            <div className="text-sm text-gray-500 mt-1">{formatDate(entry.date)}</div>
            {entry.timeCardNumber && (
              <div className="text-xs text-gray-500 mt-1">
                {entry.timeCardNumber}
              </div>
            )}
          </div>

          {/* Sign On / Sign Off / Total Hours - Single Row */}
          <div className={`bg-gray-50 p-4 rounded-lg border ${hasMissingTimes && !viewOnly ? 'border-red-400' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between gap-4">
              <div className="text-center flex-1">
                <div className="text-xs text-gray-500 mb-1">Sign On</div>
                <div className={`text-lg font-semibold ${missingSignOn && !viewOnly ? 'text-red-600' : ''}`}>
                  {entry.depotStart || '--:--'}
                </div>
                {missingSignOn && !viewOnly && (
                  <div className="flex items-center justify-center gap-1 text-xs text-red-600 mt-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Missing</span>
                  </div>
                )}
              </div>
              <div className="text-gray-400 text-xl pb-5">→</div>
              <div className="text-center flex-1">
                <div className="text-xs text-gray-500 mb-1">Sign Off</div>
                <div className={`text-lg font-semibold ${missingSignOff && !viewOnly ? 'text-red-600' : ''}`}>
                  {entry.depotFinish || '--:--'}
                </div>
                {missingSignOff && !viewOnly && (
                  <div className="flex items-center justify-center gap-1 text-xs text-red-600 mt-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Missing</span>
                  </div>
                )}
              </div>
              <div className="hidden md:block text-gray-300 text-2xl mx-2">|</div>
              <div className="text-center flex-1">
                <div className="text-xs text-gray-500 mb-1">Total Hours</div>
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
          </div>

          {/* Projects Summary */}
          {entry.projects.length > 0 && (
            <div>
              <h3 className="text-sm text-gray-500 mb-2">Projects & Work</h3>
              <div className="space-y-3">
                {entry.projects.map((project, index) => {
                  // Sort sub-activities chronologically by start time
                  const sortedSubActivities = project.subActivities 
                    ? [...project.subActivities].sort((a, b) => {
                        if (!a.start || !b.start) return 0;
                        return a.start.localeCompare(b.start);
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
                    if (subActivity.start && subActivity.finish) {
                      const [startHour, startMin] = subActivity.start.split(':').map(Number);
                      const [finishHour, finishMin] = subActivity.finish.split(':').map(Number);
                      return total + (finishHour * 60 + finishMin - startHour * 60 - startMin) / 60;
                    }
                    return total;
                  }, 0);

                  const weatherHours = calculateWeatherHours(project.weatherStart, project.weatherEnd);
                  
                  // Handle RDO type differently
                  if (project.type === 'rdo') {
                    return (
                      <div key={project.id} className="border rounded-lg p-3 bg-white">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="text-sm font-bold">RDO</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                          {project.rdoPayout && (
                            <div>
                              <span className="text-gray-500">RDO Payout:</span> {project.rdoPayout} hrs
                            </div>
                          )}
                          {project.rdoHold && (
                            <div>
                              <span className="text-gray-500">RDO Hold:</span> {project.rdoHold} hrs
                            </div>
                          )}
                        </div>
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
                      <div key={project.id} className={`border rounded-lg bg-white overflow-hidden ${hasInvalidTime || missingYardType ? 'border-red-400 bg-red-50' : ''}`}>
                        {/* Clickable Header */}
                        <div
                          className="flex justify-between items-start p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => toggleProject(project.id)}
                        >
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-gray-500" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-500" />
                            )}
                            <div className="text-base font-bold">Yard Work</div>
                            {project.lunch && (
                              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">Lunch</span>
                            )}
                            {missingYardType && (
                              <span className="flex items-center gap-1 text-xs text-red-600">
                                <AlertTriangle className="w-4 h-4" /> Activity required
                              </span>
                            )}
                            {hasInvalidTime && !missingYardType && (
                              <span className="flex items-center">
                                <AlertTriangle className="w-4 h-4 text-red-600" />
                              </span>
                            )}
                          </div>
                          {yardWorkHours > 0 && (
                            <div className="text-right">
                              <div className="text-lg font-bold text-blue-600">{yardWorkHours.toFixed(2)} hrs</div>
                            </div>
                          )}
                        </div>
                        
                        {/* Expandable Timeline Details */}
                        {isExpanded && (
                          <div className="px-4 pb-4 border-t">
                            {/* Timeline container */}
                            <div className="relative mt-3">
                              {/* Site Start */}
                              <div className="flex items-start mb-2">
                                <div className="flex items-center mr-3 relative z-10">
                                  <div className="w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow"></div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="text-sm">
                                    <span className="text-gray-500">Site Start:</span> <span className={`font-semibold ${hasInvalidTime ? 'text-red-600' : ''}`}>{project.siteStart || '--:--'}</span>
                                  </div>
                                  {hasInvalidTime && (
                                    <span className="text-xs text-red-600 bg-red-100 px-1.5 py-0.5 rounded border border-red-300 flex items-center gap-1">
                                      <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Yard Work Activity Box */}
                              {project.project && (
                                <div className="relative">
                                  {/* Vertical line */}
                                  <div className="absolute left-1.5 top-0 bottom-0 w-0.5 bg-gray-300"></div>
                                  
                                  {/* Activity box */}
                                  <div className="ml-6 mb-2">
                                    <div className="relative">
                                      {/* Dot connector */}
                                      <div className="absolute -left-6 top-2 w-3 h-3 rounded-full bg-white border-2 border-gray-300"></div>
                                      
                                      {/* Activity details */}
                                      <div className="p-2 rounded bg-yellow-50 border border-yellow-200">
                                        <div className="text-xs font-semibold mb-1">
                                          🏗️ Yard Work Activity
                                        </div>
                                        <div className="text-xs text-gray-700">
                                          {project.project}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Site Finish */}
                              <div className="flex items-start">
                                <div className="flex items-center mr-3 relative z-10">
                                  <div className="w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow"></div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="text-sm">
                                    <span className="text-gray-500">Site Finish:</span> <span className={`font-semibold ${!viewOnly && timeIsAfterSignOff(project.siteFinish) ? 'text-red-600' : ''}`}>{project.siteFinish || '--:--'}</span>
                                  </div>
                                  {!viewOnly && project.siteFinish && timeIsAfterSignOff(project.siteFinish) && (
                                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                                  )}
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
                    <div key={project.id} className={`border rounded-lg bg-white overflow-hidden ${hasInvalidTime ? 'border-red-400 bg-red-50' : ''}`}>
                      {/* Clickable Header */}
                      <div 
                        className="flex justify-between items-start p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => toggleProject(project.id)}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
                          )}
                          <div className="text-base font-bold">{project.project || 'Not specified'}</div>
                          <div className="flex gap-2 ml-2">
                            {project.lunch && (
                              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">Lunch</span>
                            )}
                            {project.weather && (
                              <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-200">
                                Weather ({weatherHours.toFixed(1)} hrs)
                              </span>
                            )}
                            {hasInvalidTime && (
                              <span className="flex items-center">
                                <AlertTriangle className="w-4 h-4 text-red-600" />
                              </span>
                            )}
                          </div>
                        </div>
                        {totalProjectHours > 0 && (
                          <div className="text-right ml-4">
                            <div className="text-lg font-bold text-blue-600">{totalProjectHours.toFixed(2)} hrs</div>
                          </div>
                        )}
                      </div>
                      
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
                                    let subActivityHours = 0;
                                    if (subActivity.start && subActivity.finish) {
                                      const [startHour, startMin] = subActivity.start.split(':').map(Number);
                                      const [finishHour, finishMin] = subActivity.finish.split(':').map(Number);
                                      subActivityHours = (finishHour * 60 + finishMin - startHour * 60 - startMin) / 60;
                                    }
                                    
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
                                                ? '⚙️ Pouring Work' 
                                                : subActivity.type === 'travel'
                                                ? '🚗 Travel To/From'
                                                : '🔧 Non-Pouring Work'}
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
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-base font-bold text-gray-700">Non-Allocated Time</div>
                    <div className="text-xs text-gray-600 mt-1">
                      Time not allocated to projects or yard work
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-700">{nonProductiveHours.toFixed(2)} hrs</div>
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
                  <div className="text-base font-bold">Remarks</div>
                </div>
              </div>
              {expandedProjects['__remarks__'] && (
                <div className="px-4 pb-4 pt-0">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{entry.remarks}</p>
                </div>
              )}
            </div>
          )}

          {/* Signature Section */}
          {!viewOnly && shouldShowSignature && (
            <div className="border-t pt-4 mt-4">
              <Label htmlFor="signature" className="text-sm">
                Employee Signature/Initials <span className="text-red-500">*</span>
              </Label>
              <Input
                id="signature"
                type="text"
                placeholder="Enter your initials or full name"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                className="mt-2 border-2 border-blue-400 bg-blue-50 focus:border-blue-500 focus:bg-white"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 px-6 pb-6">
          <Button variant="outline" onClick={onClose}>
            {viewOnly ? 'Close' : 'Cancel'}
          </Button>
          {!viewOnly && onSubmit && (
            <Button
              onClick={handleSubmit}
              disabled={(shouldShowSignature && !signature.trim()) || hasMissingTimes || hasInvalidTimeOrder || hasInvalidWorkTimes || hasUnselectedYardWork || submitState !== 'idle'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Accept & Submit
            </Button>
          )}
        </DialogFooter>

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