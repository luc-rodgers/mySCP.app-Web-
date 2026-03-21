"use client";

interface TimePickerProps {
  value: string;          // "HH:MM" or ""
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

export function TimePicker({ value, onChange, disabled, className }: TimePickerProps) {
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
    'h-12 rounded-lg border border-gray-300 bg-white text-sm text-center text-gray-900 ' +
    'focus:outline-none focus:ring-2 focus:ring-gray-900 cursor-pointer ' +
    'disabled:opacity-50 disabled:cursor-not-allowed appearance-none';

  return (
    <div className={`flex items-center gap-1 ${className ?? ''}`}>
      {/* Hour */}
      <select
        value={hh ?? ''}
        onChange={(e) => handleHour(e.target.value)}
        disabled={disabled}
        className={`${selectBase} w-[52px]`}
      >
        <option value="">--</option>
        {HOURS.map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>

      <span className="text-gray-400 font-semibold select-none">:</span>

      {/* Minute */}
      <select
        value={mm ?? ''}
        onChange={(e) => handleMinute(e.target.value)}
        disabled={disabled}
        className={`${selectBase} w-[52px]`}
      >
        <option value="">--</option>
        {MINUTES.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
    </div>
  );
}
