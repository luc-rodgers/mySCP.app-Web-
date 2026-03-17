"use client"
import { Clock, Calendar, FileText } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Button } from './ui/button';

interface TimeSheetHeaderProps {
  todayHours: number;
  weekHours: number;
}

export function TimeSheetHeader({ todayHours, weekHours }: TimeSheetHeaderProps) {
  return (
    <div className="border-b border-gray-200 p-6 pb-8">
      <div className="flex flex-col items-center mb-6">
        <div className="w-20 h-20 rounded-full mb-3 border-4 border-gray-600 shadow-lg bg-gray-50 flex items-center justify-center">
          <span className="text-2xl text-gray-900">JR</span>
        </div>
        <h2 className="mb-1 text-gray-800">Jason Rutkowski</h2>
        <span className="text-sm text-gray-600">CW4 Operator</span>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="text-gray-500 text-sm mb-1">Today</div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl text-gray-800">{todayHours.toFixed(2)}</span>
            <span className="text-gray-500">hrs</span>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="text-gray-500 text-sm mb-1">This Week</div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl text-gray-800">{weekHours.toFixed(2)}</span>
            <span className="text-gray-500">hrs</span>
          </div>
        </div>
      </div>
    </div>
  );
}