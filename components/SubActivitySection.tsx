"use client"
import { Plus, Trash2 } from 'lucide-react';
import { SubActivity } from '@/lib/types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select } from './ui/select';

interface SubActivitySectionProps {
  projectId: string;
  entryId: string;
  subActivities: SubActivity[];
  timeOptions: string[];
  isLocked: boolean;
  lunch?: boolean;
  lunchTime?: string;
  weather?: boolean;
  weatherType?: string;
  weatherStart?: string;
  weatherEnd?: string;
  approvedBy?: string;
  onAddSubActivity: (entryId: string, projectId: string, type: 'pouring' | 'non-pouring' | 'travel') => void;
  onUpdateSubActivity: (entryId: string, projectId: string, subActivityId: string, updatedSubActivity: Partial<SubActivity>) => void;
  onDeleteSubActivity: (entryId: string, projectId: string, subActivityId: string) => void;
  onUpdateLunchTime?: (entryId: string, projectId: string, lunchTime: string) => void;
  onDeleteLunch?: (entryId: string, projectId: string) => void;
  onUpdateWeather?: (entryId: string, projectId: string, weatherData: any) => void;
  onDeleteWeather?: (entryId: string, projectId: string) => void;
}

export function SubActivitySection({ projectId, entryId, subActivities, timeOptions, isLocked, lunch, lunchTime, weather, weatherType, weatherStart, weatherEnd, approvedBy, onAddSubActivity, onUpdateSubActivity, onDeleteSubActivity, onUpdateLunchTime, onDeleteLunch, onUpdateWeather, onDeleteWeather }: SubActivitySectionProps) {
  // Calculate total project hours
  const calculateProjectTotal = () => {
    let total = 0;
    
    // Sum all sub-activity hours
    subActivities.forEach((subActivity) => {
      if (subActivity.start && subActivity.finish) {
        const [startHour, startMin] = subActivity.start.split(':').map(Number);
        const [finishHour, finishMin] = subActivity.finish.split(':').map(Number);
        const hours = (finishHour * 60 + finishMin - startHour * 60 - startMin) / 60;
        total += hours;
      }
    });
    
    // Subtract lunch if applicable
    if (lunch) {
      total -= 0.5;
    }
    
    return total;
  };
  
  const projectTotal = calculateProjectTotal();

  return (
    <div className="mt-2">
      {/* Render Sub-Activities */}
      {subActivities && subActivities.length > 0 && (
        <div className="relative">
          {/* Vertical line connecting all nodes */}
          <div className="absolute left-1.5 top-0 bottom-0 w-0.5 bg-gray-300 hidden md:block"></div>
          
          {/* Activities with nodes */}
          <div className="space-y-3 md:ml-6">
            {subActivities.map((subActivity, index) => {
              // Calculate sub-activity hours
              let subActivityHours = 0;
              if (subActivity.start && subActivity.finish) {
                const [startHour, startMin] = subActivity.start.split(':').map(Number);
                const [finishHour, finishMin] = subActivity.finish.split(':').map(Number);
                subActivityHours = (finishHour * 60 + finishMin - startHour * 60 - startMin) / 60;
              }

              const getSubActivityOptions = () => {
                if (subActivity.type === 'pouring') {
                  return ['🚚 Mobile', '🏗️ Placing Boom / Skid Pump'];
                }
                return ['Clean Pump', 'Installation Boom', 'Installation Pump', 'Installation Other', 'Dismantle Boom', 'Dismantle Pump', 'Dismantle Other', 'Climb Boom', 'Preparation to Climb Boom', 'Pipeline Installation', 'Pipeline Relocation', 'Transfer Line Relocation', 'Install HD Bolts', 'Install Crucifix/Base', 'Maintenance', 'Inspections', 'Deliveries', 'Pipe Testing', 'Housekeeping', 'Other'];
              };

              // Get color based on activity type
              const getNodeColor = () => {
                if (subActivity.type === 'pouring') return 'bg-green-500 border-green-600';
                if (subActivity.type === 'travel') return 'bg-purple-500 border-purple-600';
                return 'bg-cyan-500 border-cyan-600';
              };

              return (
                <div key={subActivity.id} className="relative">
                  {/* Node connector - Desktop only */}
                  {subActivity.type === 'pouring' ? (
                    <div className="absolute -left-6 top-1/2 -translate-y-1/2 text-base hidden md:block">💦</div>
                  ) : (
                    <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 bg-white hidden md:block" style={{ borderColor: subActivity.type === 'travel' ? '#9333ea' : '#0891b2' }}></div>
                  )}
                  
                  {/* Activity card */}
                  <div className="border rounded-lg p-2 bg-white border-gray-400 shadow-sm relative md:pb-2">
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-12 md:col-span-5">
                        {subActivity.type === 'travel' ? (
                          <Input
                            id={`subActivity-${subActivity.id}`}
                            type="text"
                            value="🚗 Travel To/From"
                            className="h-10 text-sm bg-gray-50 border-gray-400 font-medium"
                            readOnly
                          />
                        ) : (
                          <Select
                            id={`subActivity-${subActivity.id}`}
                            value={subActivity.activityType}
                            className={`h-10 text-sm cursor-pointer border-gray-400 font-medium ${subActivity.activityType !== '' ? 'bg-white' : 'bg-[#E8F4FF]'} hover:bg-[#E4EEFF]`}
                            onChange={(e) => onUpdateSubActivity(entryId, projectId, subActivity.id, { activityType: e.target.value })}
                            disabled={isLocked}
                          >
                            <option value="">{subActivity.type === 'pouring' ? 'Pouring Work Activity' : 'Non-Pouring Work Activity'}</option>
                            {getSubActivityOptions().map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </Select>
                        )}
                      </div>
                      <div className="col-span-6 md:col-span-2">
                        <Select
                          id={`subActivityStart-${subActivity.id}`}
                          value={subActivity.start}
                          className={`h-10 text-sm cursor-pointer border-gray-400 font-medium ${subActivity.start !== '' ? 'bg-white' : 'bg-[#E8F4FF]'} hover:bg-[#E4EEFF]`}
                          onChange={(e) => onUpdateSubActivity(entryId, projectId, subActivity.id, { start: e.target.value })}
                          disabled={isLocked}
                        >
                          <option value="">Start</option>
                          {timeOptions.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="col-span-6 md:col-span-2">
                        <Select
                          id={`subActivityFinish-${subActivity.id}`}
                          value={subActivity.finish}
                          className={`h-10 text-sm cursor-pointer border-gray-400 font-medium ${subActivity.finish !== '' ? 'bg-white' : 'bg-[#E8F4FF]'} hover:bg-[#E4EEFF]`}
                          onChange={(e) => onUpdateSubActivity(entryId, projectId, subActivity.id, { finish: e.target.value })}
                          disabled={isLocked}
                        >
                          <option value="">Finish</option>
                          {timeOptions.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="col-span-11 md:col-span-2 flex justify-center md:block">
                        <Input
                          id={`subActivityHours-${subActivity.id}`}
                          type="text"
                          value={`${subActivityHours.toFixed(2)} hrs`}
                          className="h-10 text-sm bg-white font-medium text-center md:text-left w-full md:w-auto"
                          readOnly
                        />
                      </div>
                      <div className="flex items-end justify-end col-span-1 md:col-span-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 cursor-pointer"
                          onClick={() => onDeleteSubActivity(entryId, projectId, subActivity.id)}
                          disabled={isLocked}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Lunch Entry - Only show if lunch is true */}
            {lunch && (
              <div className="relative">
                {/* Lunch node - Desktop only */}
                <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 bg-white hidden md:block" style={{ borderColor: '#f59e0b' }}></div>
                
                {/* Lunch card */}
                <div className="border rounded-lg p-2 bg-white border-gray-400 shadow-sm">
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-12 md:col-span-5">
                      <Input
                        id={`lunch-${projectId}`}
                        type="text"
                        value="🍽️ Lunch Break - 1/2hr"
                        className="h-10 text-sm bg-gray-50 border-gray-400 font-medium"
                        readOnly
                      />
                    </div>
                    <div className="col-span-6 md:col-span-2">
                      <Select
                        id={`lunchTime-${projectId}`}
                        value={lunchTime || ''}
                        className={`h-10 text-sm cursor-pointer border-gray-400 font-medium ${lunchTime ? 'bg-white' : 'bg-[#E8F4FF]'} hover:bg-[#E4EEFF]`}
                        onChange={(e) => onUpdateLunchTime && onUpdateLunchTime(entryId, projectId, e.target.value)}
                        disabled={isLocked}
                      >
                        <option value="">Time</option>
                        {timeOptions.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="col-span-5 md:col-span-2 hidden md:block">
                      {/* Empty space to align with finish time column */}
                    </div>
                    <div className="col-span-5 md:col-span-2">
                      <Input
                        type="text"
                        value="-0.50 hrs"
                        className="h-10 text-sm bg-white font-medium text-red-600"
                        readOnly
                      />
                    </div>
                    <div className="flex items-end col-span-1 md:col-span-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 cursor-pointer"
                        onClick={() => onDeleteLunch && onDeleteLunch(entryId, projectId)}
                        disabled={isLocked}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Inclement Weather Entry - Only show if weather is true */}
            {weather && (
              <div className="relative">
                {/* Weather node - Desktop only */}
                <div className="absolute -left-6 top-1/2 -translate-y-1/2 text-base hidden md:block">🌧️</div>
                
                {/* Weather card */}
                <div className="border rounded-lg p-2 bg-white border-gray-400 shadow-sm">
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-12 md:col-span-5">
                      <Select
                        id={`weatherType-${projectId}`}
                        value={weatherType || ''}
                        className={`h-10 text-sm cursor-pointer border-gray-400 font-medium ${weatherType ? 'bg-white' : 'bg-[#E8F4FF]'} hover:bg-[#E4EEFF]`}
                        onChange={(e) => onUpdateWeather && onUpdateWeather(entryId, projectId, { weatherType: e.target.value })}
                        disabled={isLocked}
                      >
                        <option value="">Inclement Weather Type</option>
                        <option value="Rain">Rain</option>
                        <option value="Heat">Heat</option>
                        <option value="Air Quality">Air Quality</option>
                        <option value="Other">Other</option>
                      </Select>
                    </div>
                    <div className="col-span-6 md:col-span-2">
                      <Select
                        id={`weatherStart-${projectId}`}
                        value={weatherStart || ''}
                        className={`h-10 text-sm cursor-pointer border-gray-400 font-medium ${weatherStart ? 'bg-white' : 'bg-[#E8F4FF]'} hover:bg-[#E4EEFF]`}
                        onChange={(e) => onUpdateWeather && onUpdateWeather(entryId, projectId, { weatherStart: e.target.value })}
                        disabled={isLocked}
                      >
                        <option value="">Start</option>
                        {timeOptions.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="col-span-6 md:col-span-2">
                      <Select
                        id={`weatherEnd-${projectId}`}
                        value={weatherEnd || ''}
                        className={`h-10 text-sm cursor-pointer border-gray-400 font-medium ${weatherEnd ? 'bg-white' : 'bg-[#E8F4FF]'} hover:bg-[#E4EEFF]`}
                        onChange={(e) => onUpdateWeather && onUpdateWeather(entryId, projectId, { weatherEnd: e.target.value })}
                        disabled={isLocked}
                      >
                        <option value="">Finish</option>
                        {timeOptions.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="col-span-11 md:col-span-2">
                      <Input
                        type="text"
                        value={(() => {
                          if (!weatherStart || !weatherEnd) return '0.00 hrs';
                          const [startHour, startMin] = weatherStart.split(':').map(Number);
                          const [finishHour, finishMin] = weatherEnd.split(':').map(Number);
                          const hours = (finishHour * 60 + finishMin - startHour * 60 - startMin) / 60;
                          return `${Math.max(0, hours).toFixed(2)} hrs`;
                        })()}
                        className="h-10 text-sm bg-white font-medium"
                        readOnly
                      />
                    </div>
                    <div className="flex items-end col-span-1 md:col-span-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 cursor-pointer"
                        onClick={() => onDeleteWeather && onDeleteWeather(entryId, projectId)}
                        disabled={isLocked}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Approved By field - shown below the main weather entry */}
                  <div className="grid grid-cols-12 gap-2 mt-2">
                    <div className="col-span-12 md:col-span-11">
                      <Input
                        id={`approvedBy-${projectId}`}
                        type="text"
                        placeholder="APPV BY - Enter Name"
                        value={approvedBy || ''}
                        className={`h-9 text-sm border-gray-400 ${!approvedBy ? '!bg-[#E8F4FF]' : '!bg-white'}`}
                        onChange={(e) => onUpdateWeather && onUpdateWeather(entryId, projectId, { approvedBy: e.target.value })}
                        disabled={isLocked}
                      />
                    </div>
                    <div className="col-span-1 md:col-span-1">
                      {/* Empty space to align with delete button */}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Project Total - Aligned with hours column */}
      {subActivities && subActivities.length > 0 && (
        <div className="mt-3 md:ml-6">
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-12 md:col-span-9">
              {/* Empty space to align with activity columns */}
            </div>
            <div className="col-span-12 md:col-span-2">
              <div className="text-xs text-gray-500 mb-1 text-center font-medium">Project Total</div>
              <div className="h-12 flex items-center justify-center bg-blue-50 border-2 border-blue-500 rounded-lg">
                <span className="text-2xl font-bold text-blue-600">{projectTotal.toFixed(2)} hrs</span>
              </div>
            </div>
            <div className="hidden md:block col-span-1">
              {/* Empty space to align with delete button column */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}