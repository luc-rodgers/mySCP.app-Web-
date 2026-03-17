"use client"
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { X, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { TimeEntry, ProjectEntry } from '@/lib/types';

interface AddEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (entry: Omit<TimeEntry, 'id'>) => void;
}

export function AddEntryModal({ isOpen, onClose, onSubmit }: AddEntryModalProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    status: 'draft' as TimeEntry['status'],
    depotStart: '09:00',
    depotFinish: '17:00',
    projects: [
      {
        id: 'temp-1',
        type: 'project',
        project: '',
        siteStart: '09:00',
        siteFinish: '17:00',
        subActivities: [],
        weather: false,
        lunch: false,
        lunchPenalty: false,
        nonPourWork: false,
        pumpClean: false,
      }
    ] as ProjectEntry[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.projects.length === 0 || !formData.projects[0].project) return;

    onSubmit({
      date: formData.date,
      status: formData.status,
      depotStart: formData.depotStart,
      depotFinish: formData.depotFinish,
      projects: formData.projects,
    });

    setFormData({
      date: new Date().toISOString().split('T')[0],
      status: 'draft',
      depotStart: '09:00',
      depotFinish: '17:00',
      projects: [
        {
          id: 'temp-1',
          type: 'project',
          project: '',
          siteStart: '09:00',
          siteFinish: '17:00',
          subActivities: [],
          weather: false,
          lunch: false,
          lunchPenalty: false,
          nonPourWork: false,
          pumpClean: false,
        }
      ],
    });
    onClose();
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

  const addProject = () => {
    setFormData({
      ...formData,
      projects: [
        ...formData.projects,
        {
          id: `temp-${Date.now()}`,
          project: '',
          siteStart: '09:00',
          siteFinish: '17:00',
          weather: false,
          lunch: false,
          lunchPenalty: false,
          nonPourWork: false,
          pumpClean: false,
        }
      ]
    });
  };

  const removeProject = (id: string) => {
    setFormData({
      ...formData,
      projects: formData.projects.filter(p => p.id !== id)
    });
  };

  const updateProject = (id: string, updates: Partial<ProjectEntry>) => {
    setFormData({
      ...formData,
      projects: formData.projects.map(p => 
        p.id === id ? { ...p, ...updates } : p
      )
    });
  };

  const calculateWeatherHours = (start?: string, end?: string) => {
    if (!start || !end) return 0;
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    const startTotal = startHour + startMin / 60;
    const endTotal = endHour + endMin / 60;
    return Math.max(0, endTotal - startTotal);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Add Time Entry</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                type="date"
                id="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="mt-2"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="depotStart">Depot Start</Label>
                <Select
                  id="depotStart"
                  value={formData.depotStart}
                  onChange={(e) => setFormData({ ...formData, depotStart: e.target.value })}
                  className="mt-2"
                  required
                >
                  {timeOptions.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="depotFinish">Depot Finish</Label>
                <Select
                  id="depotFinish"
                  value={formData.depotFinish}
                  onChange={(e) => setFormData({ ...formData, depotFinish: e.target.value })}
                  className="mt-2"
                  required
                >
                  {timeOptions.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TimeEntry['status'] })}
                className="mt-2"
              >
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
              </Select>
            </div>

            {/* Projects Section */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label>Projects</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addProject}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Project
                </Button>
              </div>

              {formData.projects.map((project, index) => (
                <div key={project.id} className="border rounded-lg p-3 bg-gray-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Project {index + 1}</span>
                    {formData.projects.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeProject(project.id)}
                      >
                        <Trash2 className="w-3 h-3 text-red-600" />
                      </Button>
                    )}
                  </div>

                  <div>
                    <Label htmlFor={`project-${project.id}`}>Project Name</Label>
                    <Select
                      id={`project-${project.id}`}
                      value={project.project}
                      onChange={(e) => updateProject(project.id, { project: e.target.value })}
                      className="mt-2"
                      required
                    >
                      <option value="">Select a project</option>
                      {projectOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`siteStart-${project.id}`}>Site Start</Label>
                      <Select
                        id={`siteStart-${project.id}`}
                        value={project.siteStart}
                        onChange={(e) => updateProject(project.id, { siteStart: e.target.value })}
                        className="mt-2"
                      >
                        {timeOptions.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor={`siteFinish-${project.id}`}>Site Finish</Label>
                      <Select
                        id={`siteFinish-${project.id}`}
                        value={project.siteFinish}
                        onChange={(e) => updateProject(project.id, { siteFinish: e.target.value })}
                        className="mt-2"
                      >
                        {timeOptions.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`nonPourWork-${project.id}`}
                        checked={project.nonPourWork}
                        onCheckedChange={(checked) => updateProject(project.id, { nonPourWork: checked as boolean })}
                      />
                      <Label htmlFor={`nonPourWork-${project.id}`} className="text-sm cursor-pointer">
                        Non-Pour Work
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`lunch-${project.id}`}
                        checked={project.lunch}
                        onCheckedChange={(checked) => updateProject(project.id, { lunch: checked as boolean })}
                      />
                      <Label htmlFor={`lunch-${project.id}`} className="text-sm cursor-pointer">
                        Lunch
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`lunchPenalty-${project.id}`}
                        checked={project.lunchPenalty}
                        onCheckedChange={(checked) => updateProject(project.id, { lunchPenalty: checked as boolean })}
                      />
                      <Label htmlFor={`lunchPenalty-${project.id}`} className="text-sm cursor-pointer">
                        Lunch Penalty
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`pumpClean-${project.id}`}
                        checked={project.pumpClean}
                        onCheckedChange={(checked) => updateProject(project.id, { pumpClean: checked as boolean })}
                      />
                      <Label htmlFor={`pumpClean-${project.id}`} className="text-sm cursor-pointer">
                        Pump Clean
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`weather-${project.id}`}
                        checked={project.weather}
                        onCheckedChange={(checked) => updateProject(project.id, { weather: checked as boolean })}
                      />
                      <Label htmlFor={`weather-${project.id}`} className="text-sm cursor-pointer">
                        Weather
                      </Label>
                    </div>
                  </div>

                  {/* Pump Clean Details Section */}
                  {project.pumpClean && (
                    <div className="pt-3 border-t border-purple-200 bg-purple-50 px-3 pb-3 rounded-lg space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Pump Clean Duration</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateProject(project.id, { 
                            pumpClean: false,
                            pumpCleanDuration: undefined
                          })}
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
                                updateProject(project.id, { pumpCleanDuration: '15min' });
                              }
                            }}
                          />
                          <Label htmlFor={`pumpClean15-${project.id}`} className="text-sm cursor-pointer">
                            15min
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`pumpClean30-${project.id}`}
                            checked={project.pumpCleanDuration === '30min'}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                updateProject(project.id, { pumpCleanDuration: '30min' });
                              }
                            }}
                          />
                          <Label htmlFor={`pumpClean30-${project.id}`} className="text-sm cursor-pointer">
                            30min
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`pumpClean45-${project.id}`}
                            checked={project.pumpCleanDuration === '45min'}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                updateProject(project.id, { pumpCleanDuration: '45min' });
                              }
                            }}
                          />
                          <Label htmlFor={`pumpClean45-${project.id}`} className="text-sm cursor-pointer">
                            45min
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`pumpClean1hr-${project.id}`}
                            checked={project.pumpCleanDuration === '1hr'}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                updateProject(project.id, { pumpCleanDuration: '1hr' });
                              }
                            }}
                          />
                          <Label htmlFor={`pumpClean1hr-${project.id}`} className="text-sm cursor-pointer">
                            1hr
                          </Label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Weather Details Section */}
                  {project.weather && (
                    <div className="pt-3 border-t border-gray-300 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Weather Details</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateProject(project.id, { 
                            weather: false,
                            weatherType: undefined,
                            weatherStart: undefined,
                            weatherEnd: undefined,
                            approvedBy: undefined
                          })}
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor={`weatherType-${project.id}`}>Weather Type</Label>
                          <Select
                            id={`weatherType-${project.id}`}
                            value={project.weatherType || ''}
                            className="mt-2"
                            onChange={(e) => updateProject(project.id, { weatherType: e.target.value })}
                          >
                            <option value="">Select...</option>
                            <option value="Rain">Rain</option>
                            <option value="Heat">Heat</option>
                            <option value="Air Quality">Air Quality</option>
                            <option value="Other">Other</option>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor={`approvedBy-${project.id}`}>APPV BY</Label>
                          <Input
                            id={`approvedBy-${project.id}`}
                            type="text"
                            placeholder="Enter name"
                            value={project.approvedBy || ''}
                            className="mt-2"
                            onChange={(e) => updateProject(project.id, { approvedBy: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label htmlFor={`weatherStart-${project.id}`}>Start Time</Label>
                          <Select
                            id={`weatherStart-${project.id}`}
                            value={project.weatherStart || ''}
                            className="mt-2"
                            onChange={(e) => updateProject(project.id, { weatherStart: e.target.value })}
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
                          <Label htmlFor={`weatherEnd-${project.id}`}>End Time</Label>
                          <Select
                            id={`weatherEnd-${project.id}`}
                            value={project.weatherEnd || ''}
                            className="mt-2"
                            onChange={(e) => updateProject(project.id, { weatherEnd: e.target.value })}
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
                          <Label htmlFor={`weatherTotal-${project.id}`}>Total</Label>
                          <Input
                            id={`weatherTotal-${project.id}`}
                            type="text"
                            value={calculateWeatherHours(project.weatherStart, project.weatherEnd).toFixed(1)}
                            className="mt-2 bg-white"
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
            >
              Add Entry
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}