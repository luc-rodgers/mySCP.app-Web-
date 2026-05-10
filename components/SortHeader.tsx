"use client"
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export type SortDirection = 'asc' | 'desc';

export function SortHeader<F extends string>({ label, field, sortField, sortDirection, onSort, className = '' }: {
  label: string;
  field: F;
  sortField: F;
  sortDirection: SortDirection;
  onSort: (field: F) => void;
  className?: string;
}) {
  const active = sortField === field;
  const Icon = !active ? ChevronsUpDown : sortDirection === 'asc' ? ChevronUp : ChevronDown;
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={`flex items-center gap-1 text-xs uppercase tracking-wider cursor-pointer transition-colors ${active ? 'text-gray-700' : 'text-gray-400 hover:text-gray-600'} ${className}`}
    >
      <span>{label}</span>
      <Icon className="w-3 h-3" />
    </button>
  );
}
