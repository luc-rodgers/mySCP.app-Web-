"use client"
import { Mail, Phone, Settings, CheckCircle2, CircleDashed } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { EmployeeProfile } from './EmployeeProfile';
import { AddEmployeeModal } from './AddEmployeeModal';

interface Employee {
  id: string;
  name: string;
  classification: string;
  employmentType: string;
  email: string;
  phone: string;
  hoursThisWeek: number;
  status: 'active' | 'retired';
  hasAccount?: boolean;
}

interface EmployeesProps {
  initialEmployees?: Employee[];
  isAdmin?: boolean;
}

export function Employees({ initialEmployees, isAdmin = false }: EmployeesProps) {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees ?? []);

  useEffect(() => { setEmployees(initialEmployees ?? []); }, [initialEmployees]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showRetired, setShowRetired] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredEmployees = employees.filter(e => e.status === (showRetired ? 'retired' : 'active'));

  const totalEmployees = employees.filter(e => e.status === 'active').length;
  const permanentEmployees = employees.filter(e => e.employmentType === 'Permanent' && e.status === 'active').length;
  const casualEmployees = employees.filter(e => e.employmentType === 'Casual' && e.status === 'active').length;

  if (selectedEmployee) {
    return (
      <EmployeeProfile
        employee={selectedEmployee}
        onBack={() => setSelectedEmployee(null)}
        isAdmin={isAdmin}
        onUpdate={(updated) => {
          setEmployees(prev => prev.map(e => e.id === updated.id ? updated : e));
          setSelectedEmployee(updated);
        }}
      />
    );
  }

  return (
    <div className="p-4 pb-24">
      {showAddModal && <AddEmployeeModal onClose={() => setShowAddModal(false)} />}

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-gray-900 font-bold">
            {showRetired ? 'Retired Employees' : 'Employees'}
          </h1>

          {isAdmin && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                  <button
                    onClick={() => { setShowAddModal(true); setShowMenu(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Add Employee
                  </button>
                  <button
                    onClick={() => { setShowRetired(!showRetired); setShowMenu(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    {showRetired ? 'Show Active Employees' : 'Show Retired Employees'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Overview</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
            <div className="text-[#374151] text-xl font-bold">{totalEmployees}</div>
            <div className="text-gray-500 text-xs mt-0.5">Total</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
            <div className="text-[#374151] text-xl font-bold">{permanentEmployees}</div>
            <div className="text-gray-500 text-xs mt-0.5">Permanent</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
            <div className="text-[#374151] text-xl font-bold">{casualEmployees}</div>
            <div className="text-gray-500 text-xs mt-0.5">Casual</div>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredEmployees.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-gray-500">
            No {showRetired ? 'retired' : 'active'} employees
          </div>
        )}

        {/* Mobile Layout */}
        <div className="md:hidden divide-y divide-gray-100">
          {filteredEmployees.map((employee) => (
            <button
              key={employee.id}
              onClick={() => setSelectedEmployee(employee)}
              className="w-full p-4 text-left hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between w-full gap-3">
                <h3 className="text-gray-900 font-medium">{employee.name}</h3>
                <p className="text-sm text-gray-500 text-right shrink-0">{employee.classification}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:block">
          <div className="grid grid-cols-8 gap-4 bg-gray-50 px-4 py-3 border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
            <div className="col-span-2">Name</div>
            <div className="col-span-2">Position</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-1">Contact</div>
            <div className="col-span-1">Account</div>
          </div>
          <div className="divide-y divide-gray-100">
            {filteredEmployees.map((employee) => (
              <button
                key={employee.id}
                onClick={() => setSelectedEmployee(employee)}
                className="w-full grid grid-cols-8 gap-4 items-center text-sm px-4 py-4 hover:bg-gray-50 transition-colors text-left cursor-pointer"
              >
                <div className="col-span-2 text-gray-900">{employee.name}</div>
                <div className="col-span-2 text-gray-500">{employee.classification}</div>
                <div className="col-span-2 text-gray-500">{employee.employmentType}</div>
                <div className="col-span-1 flex items-center gap-2">
                  {employee.email && <Mail className="w-4 h-4 text-gray-400" />}
                  {employee.phone && <Phone className="w-4 h-4 text-gray-400" />}
                </div>
                <div className="col-span-1">
                  {employee.hasAccount
                    ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                    : <CircleDashed className="w-4 h-4 text-gray-300" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
