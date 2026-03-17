"use client"
import { Clock, MoreVertical, Plus, Trash2, X, Utensils, CloudRain, Check, Briefcase, Truck, Plane, Car, Droplet, Hammer, AlertTriangle } from 'lucide-react';
import { TimeEntry, Project, SubActivity } from '@/lib/types';
import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Textarea } from './ui/textarea';
import { ChevronDown, ChevronUp, FileCheck } from 'lucide-react';
import { TimeCardSummaryModal } from './TimeCardSummaryModal';
import { SubActivitySection } from './SubActivitySection';

interface TimeEntryCardProps {
  entry: TimeEntry;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TimeEntry['status']) => void;
  onAddProject: (entryId: string, type?: 'project' | 'yardwork' | 'leave') => void;
  onDeleteProject: (entryId: string, projectId: string) => void;
  onUpdateProject: (entryId: string, projectId: string, updatedProject: Partial<Project>) => void;
  onUpdateEntry: (entryId: string, updatedEntry: Partial<TimeEntry>) => void;
  onAddSubActivity: (entryId: string, projectId: string, type: 'pouring' | 'non-pouring' | 'travel') => void;
  onUpdateSubActivity: (entryId: string, projectId: string, subActivityId: string, updatedSubActivity: Partial<SubActivity>) => void;
  onDeleteSubActivity: (entryId: string, projectId: string, subActivityId: string) => void;
}

export function TimeEntryCard({ entry, onDelete, onStatusChange, onAddProject, onDeleteProject, onUpdateProject, onUpdateEntry, onAddSubActivity, onUpdateSubActivity, onDeleteSubActivity }: TimeEntryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [hasBeenEdited, setHasBeenEdited] = useState(false);
  const [wasSubmittedWhenEditStarted, setWasSubmittedWhenEditStarted] = useState(false);
  
  // Load expanded state from sessionStorage on mount
  useEffect(() => {
    const key = `timecard-expanded-${entry.date}`;
    const savedState = sessionStorage.getItem(key);
    // Don't auto-expand submitted entries unless in edit mode
    if (entry.status === 'submitted' && !isEditMode) {
      setIsExpanded(false);
    } else if (savedState === 'true') {
      setIsExpanded(true);
    }
  }, [entry.date, entry.status, isEditMode]);

  // Check if mobile modal should be open for this date
  useEffect(() => {
    const mobileModalKey = `timecard-mobile-modal-${entry.date}`;
    const shouldShowModal = sessionStorage.getItem(mobileModalKey);
    if (shouldShowModal === 'true') {
      setShowMobileModal(true);
    }
  }, [entry.date, entry.id]);
  
  // Save expanded state to sessionStorage whenever it changes
  const handleToggleExpanded = () => {
    // If submitted and not in edit mode, show summary modal instead of expanding
    if (entry.status === 'submitted' && !isEditMode) {
      setShowSummaryModal(true);
      return;
    }
    
    // On mobile, open modal instead of expanding inline
    if (window.innerWidth < 768) {
      setShowMobileModal(true);
      // Save to sessionStorage so modal stays open even if component remounts
      const mobileModalKey = `timecard-mobile-modal-${entry.date}`;
      sessionStorage.setItem(mobileModalKey, 'true');
    } else {
      const newState = !isExpanded;
      setIsExpanded(newState);
      const key = `timecard-expanded-${entry.date}`;
      sessionStorage.setItem(key, String(newState));
    }
  };

  // Close mobile modal and clear sessionStorage
  const handleCloseMobileModal = () => {
    setShowMobileModal(false);
    const mobileModalKey = `timecard-mobile-modal-${entry.date}`;
    sessionStorage.removeItem(mobileModalKey);
  };
  
  // When user interacts with the form, mark it as expanded
  const handleFormInteraction = () => {
    if (!isExpanded) {
      setIsExpanded(true);
      const key = `timecard-expanded-${entry.date}`;
      sessionStorage.setItem(key, 'true');
    }
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

  const handleAddSubActivity = (entryId: string, projectId: string, type: 'pouring' | 'non-pouring' | 'travel') => {
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

  const handleUpdateLunchTime = (entryId: string, projectId: string, lunchTime: string) => {
    markAsEdited();
    onUpdateProject(entryId, projectId, { lunchTime });
  };

  const handleDeleteLunch = (entryId: string, projectId: string) => {
    markAsEdited();
    onUpdateProject(entryId, projectId, { 
      lunch: false,
      lunchTime: undefined
    });
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
      case 'submitted':
        return 'bg-amber-500 text-white';
      case 'approved':
        return 'bg-green-500 text-white';
    }
  };

  const getStatusLabel = (status: TimeEntry['status']) => {
    if (status === 'submitted') return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const projectOptions = [
    '***Unknown Project***',
    'Queens St, Southport',
    'West Village - Calista',
    'West Village - Allere',
    'Cross River Rail',
    'Logan Hospital',
    'Kallangur Hospital',
    'Brooke St, Palm Beach',
    'Gatton Prison',
    'Placecrete - Kanagroo Point',
    'HB - Social Housing',
    'QPS Brisbane Grammar',
    'ZED - Bond Uni Robina',
    'BUILT St Lucia',
    'General Beton - Meriton',
    'HB - Wharf St',
    'Keybuild - Torbanlea',
    'ECCC - Coomeram Hospital',
    'ECCC - Gold Coast University',
    'McNab - Toowoomba',
    'HB - Quay Street',
    'ECCC - Esprit',
    'Monarch Toowong',
    'Exhibition Quarter',
    'Queens Wharf T5/6',
    'ECCC - Toowoomba Hospital',
    'RDX Southport',
  ];

  const hourOptions = Array.from({ length: 25 }, (_, i) => i * 0.5);

  // Helper function to round down to nearest 0.25 increment
  const roundToQuarterHour = (hours: number) => {
    return Math.floor(hours * 4) / 4;
  };

  const totalHours = (() => {
    // Determine effective start time
    let effectiveStart = entry.depotStart;
    if (!effectiveStart) {
      // Find earliest site start or weather start
      const allStartTimes: string[] = [];
      entry.projects.forEach(project => {
        if (project.siteStart) allStartTimes.push(project.siteStart);
        if (project.weather && project.weatherStart) allStartTimes.push(project.weatherStart);
      });
      if (allStartTimes.length > 0) {
        effectiveStart = allStartTimes.sort()[0]; // Sort to get earliest time
      }
    }

    // Determine effective finish time
    let effectiveFinish = entry.depotFinish;
    if (!effectiveFinish) {
      // Find latest site finish or weather end
      const allFinishTimes: string[] = [];
      entry.projects.forEach(project => {
        if (project.siteFinish) allFinishTimes.push(project.siteFinish);
        if (project.weather && project.weatherEnd) allFinishTimes.push(project.weatherEnd);
      });
      if (allFinishTimes.length > 0) {
        effectiveFinish = allFinishTimes.sort().reverse()[0]; // Sort reverse to get latest time
      }
    }

    // If we still don't have both times, return 0
    if (!effectiveStart || !effectiveFinish) return 0;
    
    const [startHour, startMin] = effectiveStart.split(':').map(Number);
    const [finishHour, finishMin] = effectiveFinish.split(':').map(Number);
    const hours = (finishHour * 60 + finishMin - startHour * 60 - startMin) / 60;
    
    // Check if any project has lunch selected
    const hasLunch = entry.projects.some(project => project.lunch);
    
    // Subtract 30 minutes (0.5 hours) if lunch is selected
    const totalHours = Math.max(0, hours - (hasLunch ? 0.5 : 0));
    
    // Round down to nearest 0.25 increment
    return roundToQuarterHour(totalHours);
  })();

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

  const generateTimeOptions = () => {
    const times: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let min = 0; min < 60; min += 15) {
        const h = hour.toString().padStart(2, '0');
        const m = min.toString().padStart(2, '0');
        times.push(`${h}:${m}`);
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  // Check if the entry is locked (submitted but not in edit mode)
  const isLocked = entry.status === 'submitted' && !isEditMode;

  return (
    <div className={`bg-white rounded-xl shadow-md overflow-hidden border-2 ${entry.status === 'submitted' ? 'border-red-500' : 'border-gray-200'}`}>
      {/* Day Header - Clickable to expand/collapse */}
      <div
        onClick={handleToggleExpanded}
        className="px-4 py-3 flex justify-between items-center w-full transition-colors cursor-pointer bg-gray-200 hover:bg-gray-300"
      >
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-gray-700" />
          <div>
            <div className="text-gray-900">{formatDate(entry.date).split(',')[0]}</div>
            <div className="text-xs text-gray-600">{formatDate(entry.date).split(',')[1]}</div>
          </div>
        </div>
        <div className="md:hidden">
          {(entry.status === 'submitted' || entry.status === 'approved' || (entry.projects.length > 0 && !isExpanded)) && entry.status !== 'draft' && (
            <Badge className={`${getStatusColor(entry.status)} text-xs`}>
              {getStatusLabel(entry.status)}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3">
            {(entry.status === 'submitted' || entry.status === 'approved' || (entry.projects.length > 0 && !isExpanded)) && entry.status !== 'draft' && (
              <Badge className={`${getStatusColor(entry.status)} text-xs`}>
                {getStatusLabel(entry.status)}
              </Badge>
            )}
          </div>
          <div className="text-sm text-gray-900">{totalHours} hrs</div>
          <div className="hidden md:block">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-700 hover:bg-gray-300 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Card Content - Collapsible - Desktop Only */}
      {isExpanded && (
        <div className="hidden md:block p-4 max-h-[70vh] overflow-y-auto" onClick={markAsEdited}>
          {/* Depot Section - Always visible by default */}
          <div className="mb-4">
            <div className="border rounded-lg p-4 bg-[rgb(255,255,255)]">
              <div className="flex items-end gap-4">
                <div className="w-48">
                  <label className="block text-xs text-gray-600 mb-1 text-center">Sign On</label>
                  <Select
                    id={`depotStart-${entry.id}`}
                    value={entry.depotStart}
                    className="h-12 text-base text-center font-bold cursor-pointer !border !border-gray-400"
                    onChange={(e) => handleUpdateEntry(entry.id, { depotStart: e.target.value })}
                    disabled={isLocked}
                  >
                    <option value="">--:--</option>
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="w-48">
                  <label className="block text-xs text-gray-600 mb-1 text-center">Sign Off</label>
                  <Select
                    id={`depotFinish-${entry.id}`}
                    value={entry.depotFinish}
                    className="h-12 text-base text-center font-bold cursor-pointer !border !border-gray-400"
                    onChange={(e) => handleUpdateEntry(entry.id, { depotFinish: e.target.value })}
                    disabled={isLocked}
                  >
                    <option value="">--:--</option>
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </Select>
                </div>
                
                {/* Add Buttons - Positioned to the right */}
                <div className="flex gap-2 ml-auto">
                  <Button
                    size="sm"
                    className="h-12 px-4 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => handleAddProject(entry.id)}
                    disabled={isLocked}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Project
                  </Button>
                  <Button
                    size="sm"
                    className="h-12 px-4 cursor-pointer bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleAddProject(entry.id, 'yardwork')}
                    disabled={isLocked}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Yard Work
                  </Button>
                  <Button
                    size="sm"
                    className="h-12 px-4 cursor-pointer bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={() => handleAddProject(entry.id, 'leave')}
                    disabled={isLocked}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Leave
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Projects Section - Only show if there are projects */}
          {entry.projects.length > 0 && (
            <div className="space-y-3 mb-3">{entry.projects.map((project, index) => {
                // Calculate project hours only if times are set
                let projectTotal = 0;
                if (project.siteStart && project.siteFinish) {
                  const [startHour, startMin] = project.siteStart.split(':').map(Number);
                  const [finishHour, finishMin] = project.siteFinish.split(':').map(Number);
                  const rawHours = (finishHour * 60 + finishMin - startHour * 60 - startMin) / 60 - (project.lunchPenalty ? 0.5 : 0);
                  // Round down to nearest 0.25 increment
                  projectTotal = roundToQuarterHour(rawHours);
                }
                
                // Determine project options and label based on type
                const getProjectOptions = () => {
                  if (project.type === 'yardwork') {
                    return ['Clean Pump', 'Inspections', 'Maintenance', 'Organize Yard', 'Equipment Prep for Site', 'Deliveries', 'Other'];
                  }
                  return projectOptions;
                };
                
                const getProjectLabel = () => {
                  if (project.type === 'yardwork') {
                    return 'Yard Work Type';
                  }
                  return 'Project Name';
                };
                
                // Special layout for Leave
                if (project.type === 'leave') {
                  return (
                    <div key={project.id} className="border-2 border-gray-400 rounded-lg p-2 bg-gray-50 relative pr-12">
                      {/* Delete button - absolutely positioned in top right */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 cursor-pointer z-10"
                        onClick={() => onDeleteProject(entry.id, project.id)}
                        disabled={isLocked}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                      
                      <div className="grid grid-cols-12 gap-2 mb-2">
                        <div className="col-span-6">
                          <Label htmlFor={`leaveType-${project.id}`} className="text-sm mb-1 block">Leave Type</Label>
                          <Select
                            id={`leaveType-${project.id}`}
                            value={project.leaveType || ''}
                            className="h-9 text-sm font-bold cursor-pointer"
                            onChange={(e) => onUpdateProject(entry.id, project.id, { leaveType: e.target.value })}
                            disabled={isLocked}
                          >
                            <option value="">Select Leave Type</option>
                            <option value="Unpaid Leave">Unpaid Leave</option>
                            <option value="Annual Leave">Annual Leave</option>
                            <option value="Sick Leave">Sick Leave</option>
                            <option value="RDO">RDO</option>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-4">
                          <Label htmlFor={`leaveStart-${project.id}`} className="text-xs text-gray-500 mb-1 block">
                            Start
                          </Label>
                          <Select
                            id={`leaveStart-${project.id}`}
                            value={project.leaveStart || ''}
                            className="h-9 text-sm cursor-pointer"
                            onChange={(e) => {
                              const newStart = e.target.value;
                              const calculatedHours = calculateLeaveHours(newStart, project.leaveFinish);
                              onUpdateProject(entry.id, project.id, { 
                                leaveStart: newStart,
                                leaveTotalHours: calculatedHours > 0 ? calculatedHours.toString() : project.leaveTotalHours
                              });
                            }}
                            disabled={isLocked}
                          >
                            <option value="">Select...</option>
                            {timeOptions.map((time) => (
                              <option key={time} value={time}>
                                {time}
                              </option>
                            ))}
                          </Select>
                        </div>
                        <div className="col-span-4">
                          <Label htmlFor={`leaveFinish-${project.id}`} className="text-xs text-gray-500 mb-1 block">
                            Finish
                          </Label>
                          <Select
                            id={`leaveFinish-${project.id}`}
                            value={project.leaveFinish || ''}
                            className="h-9 text-sm cursor-pointer"
                            onChange={(e) => {
                              const newFinish = e.target.value;
                              const calculatedHours = calculateLeaveHours(project.leaveStart, newFinish);
                              onUpdateProject(entry.id, project.id, { 
                                leaveFinish: newFinish,
                                leaveTotalHours: calculatedHours > 0 ? calculatedHours.toString() : project.leaveTotalHours
                              });
                            }}
                            disabled={isLocked}
                          >
                            <option value="">Select...</option>
                            {timeOptions.map((time) => (
                              <option key={time} value={time}>
                                {time}
                              </option>
                            ))}
                          </Select>
                        </div>
                        <div className="col-span-4">
                          <Label htmlFor={`leaveTotalHours-${project.id}`} className="text-xs text-gray-500 mb-1 block">
                            Total Hours
                          </Label>
                          <Select
                            id={`leaveTotalHours-${project.id}`}
                            value={project.leaveTotalHours || ''}
                            className="h-9 text-sm cursor-pointer"
                            onChange={(e) => onUpdateProject(entry.id, project.id, { leaveTotalHours: e.target.value })}
                            disabled={isLocked}
                          >
                            <option value="">Select...</option>
                            {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75, 4, 4.25, 4.5, 4.75, 5, 5.25, 5.5, 5.75, 6, 6.25, 6.5, 6.75, 7, 7.25, 7.5, 7.75, 8, 8.25, 8.5, 8.75, 9, 9.25, 9.5, 9.75, 10, 10.25, 10.5, 10.75, 11, 11.25, 11.5, 11.75, 12].map((hours) => (
                              <option key={hours} value={hours.toString()}>
                                {hours} {hours === 1 ? 'hr' : 'hrs'}
                              </option>
                            ))}
                          </Select>
                        </div>
                      </div>
                    </div>
                  );
                }
                
                return project.type === 'project' ? (
                  /* Project type: Tab-style layout */
                  <div key={project.id} className="relative border-4 border-gray-400 bg-white overflow-hidden rounded-[10px]">
                    {/* Main content */}
                    <div className={`px-4 pt-4 ${project.subActivities && project.subActivities.length > 0 ? 'pb-4' : 'pb-2'} bg-[#f9feff00]`}>
                      {/* Top row: Project Name, Activity Buttons, and Delete */}
                      <div className={`flex gap-2 items-start ${project.subActivities && project.subActivities.length > 0 ? 'mb-4' : 'mb-0'}`}>
                        {/* Project Name - Far Left */}
                        <div className="w-72 mr-4">
                          <Label htmlFor={`project-${project.id}`} className="text-xs text-gray-500 mb-1 block text-center">
                            Choose a project
                          </Label>
                          <Select
                            id={`project-${project.id}`}
                            value={project.project}
                            className="h-11 text-base font-bold cursor-pointer w-full bg-white"
                            onChange={(e) => onUpdateProject(entry.id, project.id, { project: e.target.value })}
                            disabled={isLocked}
                          >
                            <option value="">{getProjectLabel()}</option>
                            {getProjectOptions().map((proj) => (
                              <option key={proj} value={proj}>
                                {proj}
                              </option>
                            ))}
                          </Select>
                          {/* Highlight line underneath project dropdown */}
                          <div className="mt-2 h-1 bg-black rounded-full"></div>
                        </div>

                        {/* Activity Buttons and Delete - Anchored Right */}
                        <div className="ml-auto flex gap-2 items-center">
                          {/* Helper Text */}
                          <span className="text-sm text-gray-600 mr-4">Choose a work activity →</span>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-14 w-20 font-bold cursor-pointer border-2 border-blue-400 !bg-[#E4EEFF] hover:!bg-[#F0F5FF] flex flex-col items-center justify-center gap-0.5 py-1"
                            onClick={() => onAddSubActivity(entry.id, project.id, 'travel')}
                            disabled={isLocked}
                          >
                            <div className="flex items-center">
                              <Plus className="w-3 h-3 mr-0.5" />
                              <span className="text-base">🚗</span>
                            </div>
                            <span className="text-[10px] leading-tight">Travel To/From</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-14 w-20 font-bold cursor-pointer !bg-[#E4EEFF] border-2 border-blue-400 hover:!bg-[#F0F5FF] flex flex-col items-center justify-center gap-0.5 py-1"
                            onClick={() => onAddSubActivity(entry.id, project.id, 'pouring')}
                            disabled={isLocked}
                          >
                            <div className="flex items-center">
                              <Plus className="w-3 h-3 mr-0.5" />
                              <span className="text-base">💦</span>
                            </div>
                            <span className="text-[10px] leading-tight">Pouring</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-14 w-20 font-bold cursor-pointer !bg-[#E4EEFF] border-2 border-blue-400 hover:!bg-[#F0F5FF] flex flex-col items-center justify-center gap-0.5 py-1"
                            onClick={() => onAddSubActivity(entry.id, project.id, 'non-pouring')}
                            disabled={isLocked}
                          >
                            <div className="flex items-center">
                              <Plus className="w-3 h-3 mr-0.5" />
                              <span className="text-base">🔧</span>
                            </div>
                            <span className="text-[10px] leading-tight">Non-Pouring</span>
                          </Button>

                          {/* Delete button - Far Right */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 cursor-pointer flex-shrink-0"
                            onClick={() => onDeleteProject(entry.id, project.id)}
                            disabled={isLocked}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>

                    {/* Lunch Time for Yard Work - smaller version */}
                    {project.lunch && project.type === 'yardwork' && (
                      <div className="mb-2">
                        <div className="grid grid-cols-12 gap-2">
                          <div className="col-span-3">
                            <Select
                              id={`lunchTime-${project.id}`}
                              value={project.lunchTime || ''}
                              className="h-7 text-xs"
                              onChange={(e) => onUpdateProject(entry.id, project.id, { lunchTime: e.target.value })}
                              disabled={isLocked}
                            >
                              <option value="">Lunch Time</option>
                              {timeOptions.map((time) => (
                                <option key={time} value={time}>
                                  {time}
                                </option>
                              ))}
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sub-Activities Section - Only for Project type */}
                    <SubActivitySection
                      projectId={project.id}
                      entryId={entry.id}
                      subActivities={project.subActivities}
                      timeOptions={timeOptions}
                      isLocked={isLocked}
                      lunch={project.lunch}
                      lunchTime={project.lunchTime}
                      weather={project.weather}
                      weatherType={project.weatherType}
                      weatherStart={project.weatherStart}
                      weatherEnd={project.weatherEnd}
                      approvedBy={project.approvedBy}
                      onAddSubActivity={handleAddSubActivity}
                      onUpdateSubActivity={handleUpdateSubActivity}
                      onDeleteSubActivity={handleDeleteSubActivity}
                      onUpdateLunchTime={handleUpdateLunchTime}
                      onDeleteLunch={handleDeleteLunch}
                      onUpdateWeather={(entryId, projectId, weatherData) => {
                        onUpdateProject(entryId, projectId, weatherData);
                      }}
                      onDeleteWeather={(entryId, projectId) => {
                        onUpdateProject(entryId, projectId, { 
                          weather: false,
                          weatherType: undefined,
                          weatherStart: undefined,
                          weatherEnd: undefined,
                          approvedBy: undefined
                        });
                      }}
                    />



                    {/* Third row: Lunch, Lunch Penalty, and Inclement Weather buttons - Only for Project type */}
                    {project.type === 'project' && project.subActivities && project.subActivities.length > 0 && (
                      <div className="flex justify-start mt-3">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className={`h-14 w-20 font-bold cursor-pointer border-2 flex flex-col items-center justify-center gap-0.5 py-1 ${
                              project.lunch 
                                ? 'border-green-500' 
                                : 'border-gray-300'
                            }`}
                            onClick={() => onUpdateProject(entry.id, project.id, { lunch: !project.lunch })}
                            disabled={isLocked}
                          >
                            <div className="flex items-center">
                              {project.lunch && (
                                <Check className="w-3 h-3 mr-0.5 text-green-600" />
                              )}
                              <Utensils className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[10px] leading-tight">Lunch</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className={`h-14 w-20 font-bold cursor-pointer border-2 flex flex-col items-center justify-center gap-0.5 py-1 ${
                              project.lunchPenalty 
                                ? 'border-green-500' 
                                : 'border-gray-300'
                            }`}
                            onClick={() => onUpdateProject(entry.id, project.id, { lunchPenalty: !project.lunchPenalty })}
                            disabled={isLocked}
                          >
                            <div className="flex items-center">
                              {project.lunchPenalty && (
                                <Check className="w-3 h-3 mr-0.5 text-green-600" />
                              )}
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </div>
                            <div className="text-[10px] leading-tight text-center">
                              <div>Lunch</div>
                              <div>Penalty</div>
                            </div>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className={`h-14 w-24 font-bold cursor-pointer border-2 flex flex-col items-center justify-center gap-0.5 py-1 ${
                              project.weather 
                                ? 'border-green-500' 
                                : 'border-gray-300'
                            }`}
                            onClick={() => onUpdateProject(entry.id, project.id, { weather: !project.weather })}
                            disabled={isLocked}
                          >
                            <div className="flex items-center">
                              {project.weather && (
                                <Check className="w-3 h-3 mr-0.5 text-green-600" />
                              )}
                              <CloudRain className="w-3.5 h-3.5" />
                            </div>
                            <div className="text-[10px] leading-tight text-center">
                              <div>Inclement</div>
                              <div>Weather</div>
                            </div>
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Second row: Start and Finish times - For Yard Work type */}
                    {project.type === 'yardwork' && (
                      <div className="grid grid-cols-12 gap-2 mb-2">
                        <div className="col-span-4">
                          <Label htmlFor={`siteStart-${project.id}`} className="text-xs text-gray-500 mb-1 block">
                            Start
                          </Label>
                          <Select
                            id={`siteStart-${project.id}`}
                            value={project.siteStart || ''}
                            className="h-9 text-sm cursor-pointer"
                            onChange={(e) => onUpdateProject(entry.id, project.id, { siteStart: e.target.value })}
                            disabled={isLocked}
                          >
                            <option value="">Select...</option>
                            {timeOptions.map((time) => (
                              <option key={time} value={time}>
                                {time}
                              </option>
                            ))}
                          </Select>
                        </div>
                        <div className="col-span-4">
                          <Label htmlFor={`siteFinish-${project.id}`} className="text-xs text-gray-500 mb-1 block">
                            Finish
                          </Label>
                          <Select
                            id={`siteFinish-${project.id}`}
                            value={project.siteFinish || ''}
                            className="h-9 text-sm cursor-pointer"
                            onChange={(e) => onUpdateProject(entry.id, project.id, { siteFinish: e.target.value })}
                            disabled={isLocked}
                          >
                            <option value="">Select...</option>
                            {timeOptions.map((time) => (
                              <option key={time} value={time}>
                                {time}
                              </option>
                            ))}
                          </Select>
                        </div>
                        <div className="col-span-4">
                          <Label htmlFor={`projectTotal-${project.id}`} className="text-xs text-gray-500 mb-1 block">
                            Total
                          </Label>
                          <Input
                            id={`projectTotal-${project.id}`}
                            type="text"
                            value={projectTotal.toFixed(2)}
                            className="h-9 text-sm bg-white"
                            readOnly
                          />
                        </div>
                      </div>
                    )}



                    {/* Pump Clean Details Section */}
                    {project.pumpClean && project.type !== 'yardwork' && (
                      <div className="mt-4 pt-3 border-t border-purple-200 bg-purple-50 px-3 pb-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-xs text-gray-500">Pump Clean Duration</Label>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 cursor-pointer"
                            onClick={() => onUpdateProject(entry.id, project.id, { 
                              pumpClean: false,
                              pumpCleanDuration: undefined
                            })}
                            disabled={isLocked}
                          >
                            <Trash2 className="w-3 h-3 text-red-600" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`pumpClean15-${project.id}`}
                              checked={project.pumpCleanDuration === '15min'}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  onUpdateProject(entry.id, project.id, { pumpCleanDuration: '15min' });
                                }
                              }}
                              disabled={isLocked}
                            />
                            <Label 
                              htmlFor={`pumpClean15-${project.id}`} 
                              className="text-sm text-gray-700 cursor-pointer"
                            >
                              15min
                            </Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`pumpClean30-${project.id}`}
                              checked={project.pumpCleanDuration === '30min'}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  onUpdateProject(entry.id, project.id, { pumpCleanDuration: '30min' });
                                }
                              }}
                              disabled={isLocked}
                            />
                            <Label 
                              htmlFor={`pumpClean30-${project.id}`} 
                              className="text-sm text-gray-700 cursor-pointer"
                            >
                              30min
                            </Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`pumpClean45-${project.id}`}
                              checked={project.pumpCleanDuration === '45min'}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  onUpdateProject(entry.id, project.id, { pumpCleanDuration: '45min' });
                                }
                              }}
                              disabled={isLocked}
                            />
                            <Label 
                              htmlFor={`pumpClean45-${project.id}`} 
                              className="text-sm text-gray-700 cursor-pointer"
                            >
                              45min
                            </Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`pumpClean1hr-${project.id}`}
                              checked={project.pumpCleanDuration === '1hr'}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  onUpdateProject(entry.id, project.id, { pumpCleanDuration: '1hr' });
                                }
                              }}
                              disabled={isLocked}
                            />
                            <Label 
                              htmlFor={`pumpClean1hr-${project.id}`} 
                              className="text-sm text-gray-700 cursor-pointer"
                            >
                              1hr
                            </Label>
                          </div>
                        </div>
                      </div>
                    )}
                    </div>
                  </div>
                ) : (
                  /* Non-project types: Original box layout */
                  <div key={project.id} className="border-4 border-gray-400 rounded-lg p-2 bg-[rgba(124,154,255,0.29)] relative pr-12">
                    {/* Delete button - absolutely positioned in top right */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 cursor-pointer z-10"
                      onClick={() => onDeleteProject(entry.id, project.id)}
                      disabled={isLocked}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                    
                    {/* Top row: Project Name */}
                    <div className="grid grid-cols-12 gap-2 mb-2">
                      <div className="col-span-6">
                        <Select
                          id={`project-${project.id}`}
                          value={project.project}
                          className="h-9 text-sm font-bold cursor-pointer"
                          onChange={(e) => onUpdateProject(entry.id, project.id, { project: e.target.value })}
                          disabled={isLocked}
                        >
                          <option value="">{getProjectLabel()}</option>
                          {getProjectOptions().map((proj) => (
                            <option key={proj} value={proj}>
                              {proj}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="col-span-1">
                        {project.type === 'yardwork' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className={`w-full h-6 text-[10px] cursor-pointer ${project.lunch ? 'bg-green-100 border-green-500' : ''}`}
                            onClick={() => onUpdateProject(entry.id, project.id, { lunch: !project.lunch })}
                            disabled={isLocked}
                          >
                            {project.lunch && <Check className="w-2.5 h-2.5 mr-0.5 text-green-600" />}
                            {!project.lunch && <Utensils className="w-2.5 h-2.5 mr-0.5" />}
                            Lunch
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Remarks Section */}
          <div className="mt-4">
            <Label htmlFor={`remarks-${entry.id}`} className="text-sm font-medium text-gray-700">
              Remarks
            </Label>
            <Textarea
              id={`remarks-${entry.id}`}
              placeholder="Enter any additional work / wage details for the day..."
              value={entry.remarks || ''}
              onChange={(e) => handleUpdateEntry(entry.id, { remarks: e.target.value })}
              disabled={isLocked}
              className="mt-2 min-h-[80px] resize-none !border-2 !border-gray-400 focus:!border-blue-500 bg-white"
            />
          </div>

          {/* Submit Button - Always visible unless already submitted/approved */}
          {entry.status !== 'submitted' && entry.status !== 'approved' && (
            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                className="w-64 !bg-white hover:!bg-gray-50 !text-gray-900 !border-2 !border-gray-400 cursor-pointer font-semibold"
                onClick={() => setShowSummaryModal(true)}
              >
                <FileCheck className="w-4 h-4 mr-2" />
                Submit
              </Button>
            </div>
          )}
          
          {/* Done Editing Button - Visible when in edit mode */}
          {isEditMode && (
            <Button
              className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white cursor-pointer"
              onClick={() => {
                setIsEditMode(false);
                setIsExpanded(false);
              }}
            >
              <FileCheck className="w-4 h-4 mr-2" />
              Done Editing
            </Button>
          )}
        </div>
      )}

      {/* Summary Modal */}
      <TimeCardSummaryModal
        entry={entry}
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        onSubmit={(signature) => {
          onStatusChange(entry.id, 'submitted');
          setShowSummaryModal(false);
          setIsEditMode(false);
          setWasSubmittedWhenEditStarted(false);
          setHasBeenEdited(false);
        }}
        onEdit={entry.status === 'submitted' ? () => {
          setIsEditMode(true);
          setWasSubmittedWhenEditStarted(true);
          setHasBeenEdited(false); // Reset edit tracking
          setShowSummaryModal(false);
          setIsExpanded(true);
        } : undefined}
        viewOnly={entry.status === 'submitted' && !isEditMode}
        shouldShowSignature={!wasSubmittedWhenEditStarted || hasBeenEdited}
      />

      {/* Mobile Modal - Full Screen */}
      {showMobileModal && (
        <div className="md:hidden fixed inset-0 bg-white z-50 flex flex-col justify-center">
          {/* Modal Header */}
          <div className="relative px-4 py-3 flex justify-between items-center border-b border-gray-200 bg-gray-100">
            {/* Profile Circle - Mobile Only */}
            <div className="md:hidden absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full border-4 border-gray-600 shadow-lg bg-gray-50 flex items-center justify-center">
              <span className="text-2xl text-gray-900">JR</span>
            </div>
            
            <div>
              <div className="text-gray-900">{formatDate(entry.date).split(',')[0]}</div>
              <div className="text-xs text-gray-600">{formatDate(entry.date).split(',')[1]}</div>
            </div>
            {entry.projects.length > 0 && entry.status !== 'draft' && (
              <Badge className={`${getStatusColor(entry.status)} text-xs`}>
                {getStatusLabel(entry.status)}
              </Badge>
            )}
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-900">{totalHours} hrs</div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleCloseMobileModal}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="overflow-y-auto p-4" onClick={markAsEdited}>
            {/* Depot Section - Always visible by default */}
            <div className="mb-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1 text-center">Sign On</label>
                    <Select
                      id={`depotStart-mobile-${entry.id}`}
                      value={entry.depotStart}
                      className="h-14 text-base text-center !border !border-gray-400"
                      onChange={(e) => handleUpdateEntry(entry.id, { depotStart: e.target.value })}
                      disabled={isLocked}
                    >
                      <option value="">--:--</option>
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1 text-center">Sign Off</label>
                    <Select
                      id={`depotFinish-mobile-${entry.id}`}
                      value={entry.depotFinish}
                      className="h-14 text-base text-center !border !border-gray-400"
                      onChange={(e) => handleUpdateEntry(entry.id, { depotFinish: e.target.value })}
                      disabled={isLocked}
                    >
                      <option value="">--:--</option>
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="hidden">
                    <Input
                      id={`depotHours-mobile-${entry.id}`}
                      type="text"
                      value={(() => {
                        if (!entry.depotStart || !entry.depotFinish) return '0.00';
                        const [startHour, startMin] = entry.depotStart.split(':').map(Number);
                        const [finishHour, finishMin] = entry.depotFinish.split(':').map(Number);
                        const hours = (finishHour * 60 + finishMin - startHour * 60 - startMin) / 60;
                        return Math.max(0, hours).toFixed(2);
                      })()}
                      className="h-14 bg-white text-center"
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Projects Section */}
            {entry.projects.length > 0 && (
              <div className="space-y-3 mb-3">{entry.projects.map((project, index) => {
                  // Calculate project hours only if times are set
                  let projectTotal = 0;
                  if (project.siteStart && project.siteFinish) {
                    const [startHour, startMin] = project.siteStart.split(':').map(Number);
                    const [finishHour, finishMin] = project.siteFinish.split(':').map(Number);
                    const rawHours = (finishHour * 60 + finishMin - startHour * 60 - startMin) / 60 - (project.lunchPenalty ? 0.5 : 0);
                    projectTotal = roundToQuarterHour(rawHours);
                  }
                  
                  const getProjectOptions = () => {
                    if (project.type === 'yardwork') {
                      return ['Clean Pump', 'Inspections', 'Maintenance', 'Organize Yard', 'Equipment Prep for Site', 'Deliveries', 'Other'];
                    }
                    return projectOptions;
                  };
                  
                  const getProjectLabel = () => {
                    if (project.type === 'yardwork') {
                      return 'Yard Work Type';
                    }
                    return 'Project Name';
                  };
                  
                  // Special layout for Leave on mobile
                  if (project.type === 'leave') {
                    return (
                      <div key={project.id} className="relative mx-4 border-2 border-gray-600 rounded-3xl p-3 bg-white pr-12">
                        {/* Delete button - absolutely positioned in top right */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8 cursor-pointer z-10"
                          onClick={() => onDeleteProject(entry.id, project.id)}
                          disabled={isLocked}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                        
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor={`leaveType-mobile-${project.id}`} className="text-sm mb-1 block">Leave Type</Label>
                            <Select
                              id={`leaveType-mobile-${project.id}`}
                              value={project.leaveType || ''}
                              className="h-12 text-base w-full font-bold"
                              onChange={(e) => onUpdateProject(entry.id, project.id, { leaveType: e.target.value })}
                              disabled={isLocked}
                            >
                              <option value="">Select Leave Type</option>
                              <option value="Unpaid Leave">Unpaid Leave</option>
                              <option value="Annual Leave">Annual Leave</option>
                              <option value="Sick Leave">Sick Leave</option>
                              <option value="RDO">RDO</option>
                            </Select>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor={`leaveStart-mobile-${project.id}`} className="text-xs text-gray-600 mb-1 block text-center">
                                Start
                              </Label>
                              <Select
                                id={`leaveStart-mobile-${project.id}`}
                                value={project.leaveStart || ''}
                                className="h-12 text-base w-full text-center"
                                onChange={(e) => {
                                  const newStart = e.target.value;
                                  const calculatedHours = calculateLeaveHours(newStart, project.leaveFinish);
                                  onUpdateProject(entry.id, project.id, { 
                                    leaveStart: newStart,
                                    leaveTotalHours: calculatedHours > 0 ? calculatedHours.toString() : project.leaveTotalHours
                                  });
                                }}
                                disabled={isLocked}
                              >
                                <option value="">Select...</option>
                                {timeOptions.map((time) => (
                                  <option key={time} value={time}>
                                    {time}
                                  </option>
                                ))}
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor={`leaveFinish-mobile-${project.id}`} className="text-xs text-gray-600 mb-1 block text-center">
                                Finish
                              </Label>
                              <Select
                                id={`leaveFinish-mobile-${project.id}`}
                                value={project.leaveFinish || ''}
                                className="h-12 text-base w-full text-center"
                                onChange={(e) => {
                                  const newFinish = e.target.value;
                                  const calculatedHours = calculateLeaveHours(project.leaveStart, newFinish);
                                  onUpdateProject(entry.id, project.id, { 
                                    leaveFinish: newFinish,
                                    leaveTotalHours: calculatedHours > 0 ? calculatedHours.toString() : project.leaveTotalHours
                                  });
                                }}
                                disabled={isLocked}
                              >
                                <option value="">Select...</option>
                                {timeOptions.map((time) => (
                                  <option key={time} value={time}>
                                    {time}
                                  </option>
                                ))}
                              </Select>
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor={`leaveTotalHours-mobile-${project.id}`} className="text-xs text-gray-600 mb-1 block text-center">
                              Total Hours
                            </Label>
                            <Select
                              id={`leaveTotalHours-mobile-${project.id}`}
                              value={project.leaveTotalHours || ''}
                              className="h-12 text-base w-full text-center"
                              onChange={(e) => onUpdateProject(entry.id, project.id, { leaveTotalHours: e.target.value })}
                              disabled={isLocked}
                            >
                              <option value="">Select...</option>
                              {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75, 4, 4.25, 4.5, 4.75, 5, 5.25, 5.5, 5.75, 6, 6.25, 6.5, 6.75, 7, 7.25, 7.5, 7.75, 8, 8.25, 8.5, 8.75, 9, 9.25, 9.5, 9.75, 10, 10.25, 10.5, 10.75, 11, 11.25, 11.5, 11.75, 12].map((hours) => (
                                <option key={hours} value={hours.toString()}>
                                  {hours} {hours === 1 ? 'hr' : 'hrs'}
                                </option>
                              ))}
                            </Select>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  
                  return project.type === 'project' ? (
                    /* Project type: Tab-style layout for mobile */
                    <div key={project.id} className="relative mx-4 border-2 border-gray-600 rounded-3xl bg-white overflow-hidden">
                      {/* Tab header with project name dropdown */}
                      <div className="bg-gray-100 border-b-2 border-gray-600 px-4 py-3 relative">
                        {/* Project dropdown and delete button on same line */}
                        <div className="flex items-center gap-2">
                          <Select
                            id={`project-mobile-${project.id}`}
                            value={project.project}
                            className="flex-1 h-14 text-base text-center font-bold cursor-pointer"
                            onChange={(e) => onUpdateProject(entry.id, project.id, { project: e.target.value })}
                            disabled={isLocked}
                          >
                            <option value="">{getProjectLabel()}</option>
                            {getProjectOptions().map((proj) => (
                              <option key={proj} value={proj}>
                                {proj}
                              </option>
                            ))}
                          </Select>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 cursor-pointer flex-shrink-0"
                            onClick={() => onDeleteProject(entry.id, project.id)}
                            disabled={isLocked}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Main content */}
                      <div className="p-4">

                      {/* Second row: +Travel, +Pouring, +Non-Pouring buttons - Only for Project type */}
                      {project.type === 'project' && (
                        <div className="flex gap-6 justify-center mb-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-14 w-20 font-bold cursor-pointer border-2 border-blue-400 !bg-[#E4EEFF] hover:!bg-[#F0F5FF] flex flex-col items-center justify-center gap-0.5 py-1"
                            onClick={() => onAddSubActivity(entry.id, project.id, 'travel')}
                            disabled={isLocked}
                          >
                            <div className="flex items-center">
                              <Plus className="w-3 h-3 mr-0.5" />
                              <span className="text-base">🚗</span>
                            </div>
                            <span className="text-[10px] leading-tight">Travel To/From</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-14 w-20 font-bold cursor-pointer !bg-[#E4EEFF] border-2 border-blue-400 hover:!bg-[#F0F5FF] flex flex-col items-center justify-center gap-0.5 py-1"
                            onClick={() => onAddSubActivity(entry.id, project.id, 'pouring')}
                            disabled={isLocked}
                          >
                            <div className="flex items-center">
                              <Plus className="w-3 h-3 mr-0.5" />
                              <span className="text-base">💦</span>
                            </div>
                            <span className="text-[10px] leading-tight">Pouring</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-14 w-20 font-bold cursor-pointer !bg-[#E4EEFF] border-2 border-blue-400 hover:!bg-[#F0F5FF] flex flex-col items-center justify-center gap-0.5 py-1"
                            onClick={() => onAddSubActivity(entry.id, project.id, 'non-pouring')}
                            disabled={isLocked}
                          >
                            <div className="flex items-center">
                              <Plus className="w-3 h-3 mr-0.5" />
                              <span className="text-base">🔧</span>
                            </div>
                            <span className="text-[10px] leading-tight">Non-Pouring</span>
                          </Button>
                        </div>
                      )}
                      
                      {/* Third row: Lunch + Lunch Penalty + Weather - Only for Project type */}
                      {project.type === 'project' && project.subActivities && project.subActivities.length > 0 && (
                        <div className="flex justify-center gap-6 mb-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className={`h-14 w-20 font-bold cursor-pointer border-2 flex flex-col items-center justify-center gap-0.5 py-1 ${
                              project.lunch 
                                ? 'border-green-500' 
                                : 'border-gray-300'
                            }`}
                            onClick={() => onUpdateProject(entry.id, project.id, { lunch: !project.lunch })}
                            disabled={isLocked}
                          >
                            <div className="flex items-center">
                              {project.lunch && (
                                <Check className="w-3 h-3 mr-0.5 text-green-600" />
                              )}
                              <Utensils className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[10px] leading-tight">Lunch</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className={`h-14 w-20 font-bold cursor-pointer border-2 flex flex-col items-center justify-center gap-0.5 py-1 ${
                              project.lunchPenalty 
                                ? 'border-green-500' 
                                : 'border-gray-300'
                            }`}
                            onClick={() => onUpdateProject(entry.id, project.id, { lunchPenalty: !project.lunchPenalty })}
                            disabled={isLocked}
                          >
                            <div className="flex items-center">
                              {project.lunchPenalty && (
                                <Check className="w-3 h-3 mr-0.5 text-green-600" />
                              )}
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </div>
                            <div className="text-[10px] leading-tight text-center">
                              <div>Lunch</div>
                              <div>Penalty</div>
                            </div>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className={`h-14 w-24 font-bold cursor-pointer border-2 flex flex-col items-center justify-center gap-0.5 py-1 ${
                              project.weather 
                                ? 'border-green-500' 
                                : 'border-gray-300'
                            }`}
                            onClick={() => onUpdateProject(entry.id, project.id, { weather: !project.weather })}
                            disabled={isLocked}
                          >
                            <div className="flex items-center">
                              {project.weather && (
                                <Check className="w-3 h-3 mr-0.5 text-green-600" />
                              )}
                              <CloudRain className="w-3.5 h-3.5" />
                            </div>
                            <div className="text-[10px] leading-tight text-center">
                              <div>Inclement</div>
                              <div>Weather</div>
                            </div>
                          </Button>
                        </div>
                      )}
                      
                      {/* Yard Work: just lunch button */}
                      {project.type === 'yardwork' && (
                        <div className="flex items-center gap-2 mb-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className={`flex-1 h-6 text-[10px] ${project.lunch ? 'bg-green-100 border-green-500' : ''}`}
                            onClick={() => onUpdateProject(entry.id, project.id, { lunch: !project.lunch })}
                            disabled={isLocked}
                          >
                            {project.lunch && <Check className="w-2.5 h-2.5 mr-0.5 text-green-600" />}
                            {!project.lunch && <Utensils className="w-2.5 h-2.5 mr-0.5" />}
                            Lunch
                          </Button>
                        </div>
                      )}

                      {/* Lunch Extension - Show when lunch is selected (only for yardwork, not project type) */}
                      {project.lunch && project.type === 'yardwork' && (
                        <div className="mb-3 p-3 bg-blue-50 rounded border border-blue-200">
                          <div className="flex flex-col gap-2">
                            <Select
                              id={`lunchTime-mobile-${project.id}`}
                              value={project.lunchTime || ''}
                              className="h-10 text-sm"
                              onChange={(e) => onUpdateProject(entry.id, project.id, { lunchTime: e.target.value })}
                              disabled={isLocked}
                            >
                              <option value="">Lunch Time</option>
                              {timeOptions.map((time) => (
                                <option key={time} value={time}>
                                  {time}
                                </option>
                              ))}
                            </Select>
                          </div>
                        </div>
                      )}

                      {/* Sub-Activities Section - Only for Project type */}
                      <SubActivitySection
                        projectId={project.id}
                        entryId={entry.id}
                        subActivities={project.subActivities}
                        timeOptions={timeOptions}
                        isLocked={isLocked}
                        lunch={project.lunch}
                        lunchTime={project.lunchTime}
                        weather={project.weather}
                        weatherType={project.weatherType}
                        weatherStart={project.weatherStart}
                        weatherEnd={project.weatherEnd}
                        approvedBy={project.approvedBy}
                        onAddSubActivity={handleAddSubActivity}
                        onUpdateSubActivity={handleUpdateSubActivity}
                        onDeleteSubActivity={handleDeleteSubActivity}
                        onUpdateLunchTime={handleUpdateLunchTime}
                        onDeleteLunch={handleDeleteLunch}
                        onUpdateWeather={(entryId, projectId, weatherData) => {
                          onUpdateProject(entryId, projectId, weatherData);
                        }}
                        onDeleteWeather={(entryId, projectId) => {
                          onUpdateProject(entryId, projectId, { 
                            weather: false,
                            weatherType: undefined,
                            weatherStart: undefined,
                            weatherEnd: undefined,
                            approvedBy: undefined
                          });
                        }}
                      />

                      {/* Second row: +Travel, +Pouring, +Non-Pouring buttons - Only for Project type */}
                      {project.type === 'yardwork' && (
                        <div className="space-y-2 mb-3">
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <Label htmlFor={`siteStart-mobile-${project.id}`} className="text-xs text-gray-500 mb-1 block">
                                Start
                              </Label>
                              <Select
                                id={`siteStart-mobile-${project.id}`}
                                value={project.siteStart || ''}
                                className="h-12 text-sm cursor-pointer"
                                onChange={(e) => onUpdateProject(entry.id, project.id, { siteStart: e.target.value })}
                                disabled={isLocked}
                              >
                                <option value="">Select...</option>
                                {timeOptions.map((time) => (
                                  <option key={time} value={time}>
                                    {time}
                                  </option>
                                ))}
                              </Select>
                            </div>
                            <div className="flex-1">
                              <Label htmlFor={`siteFinish-mobile-${project.id}`} className="text-xs text-gray-500 mb-1 block">
                                Finish
                              </Label>
                              <Select
                                id={`siteFinish-mobile-${project.id}`}
                                value={project.siteFinish || ''}
                                className="h-12 text-sm cursor-pointer"
                                onChange={(e) => onUpdateProject(entry.id, project.id, { siteFinish: e.target.value })}
                                disabled={isLocked}
                              >
                                <option value="">Select...</option>
                                {timeOptions.map((time) => (
                                  <option key={time} value={time}>
                                    {time}
                                  </option>
                                ))}
                              </Select>
                            </div>
                            <div className="flex-1">
                              <Label htmlFor={`projectTotal-mobile-${project.id}`} className="text-xs text-gray-500 mb-1 block">
                                Total
                              </Label>
                              <Input
                                id={`projectTotal-mobile-${project.id}`}
                                type="text"
                                value={projectTotal.toFixed(2)}
                                className="h-12 text-sm bg-white"
                                readOnly
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Pump Clean Details Section */}
                      {project.pumpClean && project.type !== 'yardwork' && (
                        <div className="mt-4 pt-3 border-t border-purple-200 bg-purple-50 px-3 pb-3 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-xs text-gray-500">Pump Clean Duration</Label>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => onUpdateProject(entry.id, project.id, { 
                                pumpClean: false,
                                pumpCleanDuration: undefined
                              })}
                              disabled={isLocked}
                            >
                              <Trash2 className="w-3 h-3 text-red-600" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={`pumpClean15-mobile-${project.id}`}
                                checked={project.pumpCleanDuration === '15min'}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    onUpdateProject(entry.id, project.id, { pumpCleanDuration: '15min' });
                                  }
                                }}
                                disabled={isLocked}
                              />
                              <Label 
                                htmlFor={`pumpClean15-mobile-${project.id}`} 
                                className="text-sm text-gray-700 cursor-pointer"
                              >
                                15min
                              </Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={`pumpClean30-mobile-${project.id}`}
                                checked={project.pumpCleanDuration === '30min'}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    onUpdateProject(entry.id, project.id, { pumpCleanDuration: '30min' });
                                  }
                                }}
                                disabled={isLocked}
                              />
                              <Label 
                                htmlFor={`pumpClean30-mobile-${project.id}`} 
                                className="text-sm text-gray-700 cursor-pointer"
                              >
                                30min
                              </Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={`pumpClean45-mobile-${project.id}`}
                                checked={project.pumpCleanDuration === '45min'}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    onUpdateProject(entry.id, project.id, { pumpCleanDuration: '45min' });
                                  }
                                }}
                                disabled={isLocked}
                              />
                              <Label 
                                htmlFor={`pumpClean45-mobile-${project.id}`} 
                                className="text-sm text-gray-700 cursor-pointer"
                              >
                                45min
                              </Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={`pumpClean1hr-mobile-${project.id}`}
                                checked={project.pumpCleanDuration === '1hr'}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    onUpdateProject(entry.id, project.id, { pumpCleanDuration: '1hr' });
                                  }
                                }}
                                disabled={isLocked}
                              />
                              <Label 
                                htmlFor={`pumpClean1hr-mobile-${project.id}`} 
                                className="text-sm text-gray-700 cursor-pointer"
                              >
                                1hr
                              </Label>
                            </div>
                          </div>
                        </div>
                      )}
                      </div>
                    </div>
                  ) : (
                    /* Non-project types: Original box layout for mobile */
                    <div key={project.id} className="relative mx-4 border-2 border-gray-600 rounded-3xl p-3 bg-white pr-12">
                      {/* Delete button - absolutely positioned in top right */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-10 w-10 cursor-pointer z-10"
                        onClick={() => onDeleteProject(entry.id, project.id)}
                        disabled={isLocked}
                      >
                        <Trash2 className="w-5 h-5 text-red-600" />
                      </Button>
                      
                      {/* Top row: Project Name */}
                      <div className="mb-2">
                        <Select
                          id={`project-mobile-${project.id}`}
                          value={project.project}
                          className="h-14 text-base w-full text-center font-bold"
                          onChange={(e) => onUpdateProject(entry.id, project.id, { project: e.target.value })}
                          disabled={isLocked}
                        >
                          <option value="">{getProjectLabel()}</option>
                          {getProjectOptions().map((proj) => (
                            <option key={proj} value={proj}>
                              {proj}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </div>
                  );
                })}</div>
            )}
            
            {/* Add Project Buttons - Mobile */}
            <div className="flex gap-4 justify-center mb-3">
              <div className="flex flex-col items-center gap-1">
                <Button
                  size="sm"
                  className="w-14 h-14 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white p-0 border-2 border-blue-600"
                  onClick={() => handleAddProject(entry.id)}
                  disabled={isLocked}
                >
                  <Briefcase className="w-6 h-6" />
                </Button>
                <span className="text-xs text-gray-600">Project</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Button
                  size="sm"
                  className="w-14 h-14 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white p-0 border-2 border-blue-600"
                  onClick={() => handleAddProject(entry.id, 'yardwork')}
                  disabled={isLocked}
                >
                  <Truck className="w-6 h-6" />
                </Button>
                <span className="text-xs text-gray-600">Yard Work</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Button
                  size="sm"
                  className="w-14 h-14 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white p-0 border-2 border-blue-600"
                  onClick={() => handleAddProject(entry.id, 'leave')}
                  disabled={isLocked}
                >
                  <Plane className="w-6 h-6" />
                </Button>
                <span className="text-xs text-gray-600">Leave</span>
              </div>
            </div>

            {/* Submit Button */}
            {entry.status !== 'submitted' && entry.status !== 'approved' && (
              <Button
                variant="outline"
                className="w-full mt-4 !bg-white hover:!bg-gray-50 !text-gray-900 !border-2 !border-gray-400 cursor-pointer font-semibold"
                onClick={() => {
                  handleCloseMobileModal();
                  setShowSummaryModal(true);
                }}
              >
                <FileCheck className="w-4 h-4 mr-2" />
                Submit
              </Button>
            )}
            
            {/* Done Editing Button - Visible when in edit mode */}
            {isEditMode && (
              <Button
                className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                onClick={() => {
                  setIsEditMode(false);
                  handleCloseMobileModal();
                }}
              >
                <FileCheck className="w-4 h-4 mr-2" />
                Done Editing
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}