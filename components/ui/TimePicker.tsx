"use client";

import { ChevronDown } from "lucide-react";

interface TimePickerProps {
  value: string;          // "HH:MM" or ""
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  /** Compact mode: smaller height, no hr/min labels */
  compact?: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

export function TimePicker({ value, onChange, disabled, className, compact }: TimePickerProps) {
  const [hh, mm] = value ? value.split(':') : ['', ''];

  const handleHour = (h: string) => {
    if (!h) { onChange(''); return; }
    onChange(`${h}:${mm || '00'}`);
  };

  const handleMinute = (m: string) => {
    if (!m) { onChange(''); return; }
    onChange(`${hh || '00'}:${m}`);
  };

  const selectBase =
    `${compact ? 'h-8 text-xs' : 'h-12 text-sm'} w-full rounded-lg border border-gray-300 bg-white text-center text-gray-900 ` +
    'appearance-none pl-2 pr-6 ' +
    'focus:outline-none focus:ring-2 focus:ring-gray-900 cursor-pointer ' +
    'disabled:opacity-50 disabled:cursor-not-allowed';

  const iconSize = compact ? 'w-3 h-3' : 'w-3.5 h-3.5';
  const selectWidth = compact ? 'w-[56px]' : 'w-[68px]';

  return (
    <div className={`flex items-center gap-1 ${className ?? ''}`}>
      {/* Hour */}
      <div className="flex flex-col items-center gap-0.5">
        <div className={`relative ${selectWidth}`}>
          <select
            value={hh ?? ''}
            onChange={(e) => handleHour(e.target.value)}
            disabled={disabled}
            className={selectBase}
          >
            <option value="">--</option>
            {HOURS.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
          <ChevronDown className={`pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 ${iconSize} text-gray-400`} />
        </div>
        {!compact && <span className="text-[10px] text-gray-400 leading-none">hr</span>}
      </div>

      <span className={`text-gray-400 font-semibold select-none ${compact ? '' : 'pb-3'}`}>:</span>

      {/* Minute */}
      <div className="flex flex-col items-center gap-0.5">
        <div className={`relative ${selectWidth}`}>
          <select
            value={mm ?? ''}
            onChange={(e) => handleMinute(e.target.value)}
            disabled={disabled}
            className={selectBase}
          >
            <option value="">--</option>
            {MINUTES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <ChevronDown className={`pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 ${iconSize} text-gray-400`} />
        </div>
        {!compact && <span className="text-[10px] text-gray-400 leading-none">min</span>}
      </div>
    </div>
  );
}
