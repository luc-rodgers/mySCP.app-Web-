"use client"
import { Mail, Phone, Clock, Settings } from 'lucide-react';
import { Employee, TimeEntry } from '@/lib/types';
import { useState, useRef, useEffect } from 'react';
import { TimeCardSummaryModal } from './TimeCardSummaryModal';
import { EditEmployeeModal } from './EditEmployeeModal';

interface ProfileProps {
  employee: Employee;
  entries?: TimeEntry[];
  employeeId: string;
  firstName: string;
  lastName: string;
  classification: string;
  employmentType: string;
  role: string;
  showClaimAdmin?: boolean;
}

export function Profile({
  employee,
  entries = [],
  employeeId,
  firstName,
  lastName,
  classification,
  employmentType,
  role,
}: ProfileProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [selectedTimeCard, setSelectedTimeCard] = useState<TimeEntry | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || '?';

  const submittedTimeCards = entries
    .filter(e => e.status === 'submitted' || e.status === 'approved')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const calculateTotalHours = (entry: TimeEntry) => {
    if (!entry.depotStart || !entry.depotFinish) return 0;
    const [sh, sm] = entry.depotStart.split(':').map(Number);
    const [fh, fm] = entry.depotFinish.split(':').map(Number);
    const hours = (fh * 60 + fm - sh * 60 - sm) / 60;
    const hasLunch = entry.projects.some(p => p.lunch);
    return Math.max(0, hours - (hasLunch ? 0.5 : 0));
  };

  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-AU', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  const totalTimeCards = submittedTimeCards.length;
  const totalHours = submittedTimeCards.reduce((sum, e) => sum + calculateTotalHours(e), 0);
  const avgHoursPerCard = totalTimeCards > 0 ? (totalHours / totalTimeCards).toFixed(1) : '0.0';

  return (
    <div className="min-h-screen bg-[#f3f3f5] pb-24 pt-4">

      {/* Profile card */}
      <div className="mx-4 mb-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

          {/* Gear menu */}
          <div className="flex justify-end mb-2" ref={menuRef}>
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-10 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                  <button
                    onClick={() => { setShowEdit(true); setShowMenu(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Edit Profile
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Avatar + name */}
          <div className="flex flex-col items-center text-center mb-5">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-3 ring-4 ring-gray-50">
              <span className="text-2xl font-bold text-gray-700">{initials}</span>
            </div>
            <h1 className="text-gray-900 font-bold text-xl mb-2">{employee.name}</h1>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {classification && (
                <span className="bg-gray-100 text-gray-500 text-xs font-medium px-3 py-1 rounded-full">
                  {classification}
                </span>
              )}
              {employmentType && (
                <span className="bg-gray-100 text-gray-500 text-xs font-medium px-3 py-1 rounded-full">
                  {employmentType}
                </span>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 mb-4" />

          {/* Contact details */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Contact Details
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-gray-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-sm text-gray-800 truncate">{employee.email || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Phone</p>
                <p className="text-sm text-gray-800">{employee.phone || '—'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mx-4 mb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Statistics
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-2xl font-bold text-gray-800">{totalTimeCards}</p>
            <p className="text-xs text-gray-400 mt-1 leading-tight">Time Cards</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-2xl font-bold text-gray-800">{avgHoursPerCard}</p>
            <p className="text-xs text-gray-400 mt-1 leading-tight">Avg Hrs/Day</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-2xl font-bold text-gray-800">{totalHours.toFixed(0)}</p>
            <p className="text-xs text-gray-400 mt-1 leading-tight">Total Hours</p>
          </div>
        </div>
      </div>

      {/* Work History */}
      <div className="mx-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Work History
        </p>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {submittedTimeCards.length === 0 ? (
            <div className="py-10 text-center">
              <Clock className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No work history yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {submittedTimeCards.map((entry) => {
                const hrs = calculateTotalHours(entry);
                return (
                  <button
                    key={entry.id}
                    onClick={() => setSelectedTimeCard(entry)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer text-left"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{formatDate(entry.date)}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{entry.timeCardNumber || 'N/A'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-800">
                        {hrs.toFixed(2)} hrs
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        entry.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {entry.status === 'approved' ? 'Approved' : 'Pending'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showEdit && (
        <EditEmployeeModal
          employee={{
            id: employeeId,
            firstName,
            lastName,
            email: employee.email,
            phone: employee.phone,
            classification,
            employmentType,
            role,
            activeStatus: 'active',
          }}
          isAdmin={true}
          onClose={() => setShowEdit(false)}
        />
      )}

      {selectedTimeCard && (
        <TimeCardSummaryModal
          entry={selectedTimeCard}
          isOpen={true}
          onClose={() => setSelectedTimeCard(null)}
          viewOnly={true}
          onEdit={() => {}}
        />
      )}
    </div>
  );
}
