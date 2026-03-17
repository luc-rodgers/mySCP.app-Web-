"use client"
import { Users, Plus, Mail, Phone } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useState } from 'react';
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
}

interface EmployeesProps {
  initialEmployees?: Employee[];
}

export function Employees({ initialEmployees }: EmployeesProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [viewStatus, setViewStatus] = useState<'active' | 'retired'>('active');
  const [showAddModal, setShowAddModal] = useState(false);

  const defaultEmployees: Employee[] = [
    { id: '1', name: 'Aaron Baldachino', classification: 'CW4 Pump Operator', employmentType: 'Permanent', email: 'aaron.baldachino@company.com', phone: '(555) 000-0001', hoursThisWeek: 0, status: 'active' },
    { id: '2', name: 'Aperhama Bo Palmer', classification: 'CW4 Pump Operator', employmentType: 'Casual', email: 'aperhama.palmer@company.com', phone: '(555) 000-0002', hoursThisWeek: 0, status: 'active' },
    { id: '3', name: 'Ashley Curd', classification: 'CW4 Pump Operator', employmentType: 'Casual', email: 'ashley.curd@company.com', phone: '(555) 000-0003', hoursThisWeek: 0, status: 'active' },
    { id: '4', name: 'Chris Martin', classification: 'CW4 Pump Operator', employmentType: 'Casual', email: 'chris.martin@company.com', phone: '(555) 000-0004', hoursThisWeek: 0, status: 'active' },
    { id: '5', name: 'Dan Greaney', classification: 'Site Manager', employmentType: 'Permanent', email: 'dan.greaney@company.com', phone: '(555) 000-0005', hoursThisWeek: 0, status: 'active' },
    { id: '6', name: 'Daniel Wood', classification: 'CW4 Pump Operator', employmentType: 'Casual', email: 'daniel.wood@company.com', phone: '(555) 000-0006', hoursThisWeek: 0, status: 'active' },
    { id: '7', name: 'David Lavigne', classification: 'CW4 Pump Operator', employmentType: 'Permanent', email: 'david.lavigne@company.com', phone: '(555) 000-0007', hoursThisWeek: 0, status: 'active' },
    { id: '8', name: 'Elisha Hill', classification: 'CW2 Line Hand', employmentType: 'Casual', email: 'elisha.hill@company.com', phone: '(555) 000-0008', hoursThisWeek: 0, status: 'active' },
    { id: '9', name: 'Joel Goodall', classification: 'CW4 Pump Operator', employmentType: 'Permanent', email: 'joel.goodall@company.com', phone: '(555) 000-0009', hoursThisWeek: 0, status: 'active' },
    { id: '10', name: 'Joseph Goss', classification: 'CW2 Line Hand', employmentType: 'Casual', email: 'joseph.goss@company.com', phone: '(555) 000-0010', hoursThisWeek: 0, status: 'active' },
    { id: '11', name: 'Kris Taufa', classification: 'CW4 Pump Operator', employmentType: 'Casual', email: 'kris.taufa@company.com', phone: '(555) 000-0011', hoursThisWeek: 0, status: 'active' },
    { id: '12', name: 'Kevin Horne', classification: 'CW4 Pump Operator', employmentType: 'Permanent', email: 'kevin.horne@company.com', phone: '(555) 000-0012', hoursThisWeek: 0, status: 'active' },
    { id: '13', name: 'Leqhan Hill', classification: 'CW2 Line Hand', employmentType: 'Casual', email: 'leqhan.hill@company.com', phone: '(555) 000-0013', hoursThisWeek: 0, status: 'active' },
    { id: '14', name: 'Nathan Mead', classification: 'CW4 Pump Operator', employmentType: 'Permanent', email: 'nathan.mead@company.com', phone: '(555) 000-0014', hoursThisWeek: 0, status: 'active' },
    { id: '15', name: 'Nickolas Bryce', classification: 'CW2 Line Hand', employmentType: 'Casual', email: 'nickolas.bryce@company.com', phone: '(555) 000-0015', hoursThisWeek: 0, status: 'active' },
    { id: '16', name: 'Richard Squires', classification: 'CW4 Pump Operator', employmentType: 'Permanent', email: 'richard.squires@company.com', phone: '(555) 000-0016', hoursThisWeek: 0, status: 'active' },
    { id: '17', name: 'Riley Adamson', classification: 'Trainee', employmentType: 'Casual', email: 'riley.adamson@company.com', phone: '(555) 000-0017', hoursThisWeek: 0, status: 'active' },
    { id: '18', name: 'Robert Williams', classification: 'CW4 Pump Operator', employmentType: 'Permanent', email: 'robert.williams@company.com', phone: '(555) 000-0018', hoursThisWeek: 0, status: 'active' },
    { id: '19', name: 'Rusty Pullham', classification: 'CW4 Pump Operator', employmentType: 'Casual', email: 'rusty.pullham@company.com', phone: '(555) 000-0019', hoursThisWeek: 0, status: 'active' },
    { id: '20', name: 'Sean Korostovetz', classification: 'CW4 Pump Operator', employmentType: 'Permanent', email: 'sean.korostovetz@company.com', phone: '(555) 000-0020', hoursThisWeek: 0, status: 'active' },
    { id: '21', name: 'Simon Oster', classification: 'CW4 Pump Operator', employmentType: 'Permanent', email: 'simon.oster@company.com', phone: '(555) 000-0021', hoursThisWeek: 0, status: 'active' },
    { id: '22', name: 'Simon Thiess', classification: 'CW4 Pump Operator', employmentType: 'Permanent', email: 'simon.thiess@company.com', phone: '(555) 000-0022', hoursThisWeek: 0, status: 'active' },
    { id: '23', name: 'Troy Sperling', classification: 'CW4 Pump Operator', employmentType: 'Permanent', email: 'troy.sperling@company.com', phone: '(555) 000-0023', hoursThisWeek: 0, status: 'active' },
    { id: '24', name: 'Shaun Boggon', classification: 'CW4 Pump Operator', employmentType: 'Casual', email: 'shaun.boggon@company.com', phone: '(555) 000-0024', hoursThisWeek: 0, status: 'active' },
    { id: '25', name: 'Mark Thompson', classification: 'CW4 Pump Operator', employmentType: 'Permanent', email: 'mark.thompson@company.com', phone: '(555) 000-0025', hoursThisWeek: 0, status: 'retired' },
    { id: '26', name: 'Peter Collins', classification: 'Site Manager', employmentType: 'Permanent', email: 'peter.collins@company.com', phone: '(555) 000-0026', hoursThisWeek: 0, status: 'retired' },
    { id: '27', name: 'John Davis', classification: 'CW2 Line Hand', employmentType: 'Casual', email: 'john.davis@company.com', phone: '(555) 000-0027', hoursThisWeek: 0, status: 'retired' },
  ];

  const employees = initialEmployees ?? defaultEmployees;

  const getStatusColor = (status: 'permanent' | 'casual' | 'retired') => {
    switch (status) {
      case 'permanent':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'casual':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'retired':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Filter employees based on selected status
  const filteredEmployees = employees.filter(e => e.status === viewStatus);

  const totalEmployees = employees.filter(e => e.status === 'active').length;
  const permanentEmployees = employees.filter(e => e.employmentType === 'Permanent' && e.status === 'active').length;
  const casualEmployees = employees.filter(e => e.employmentType === 'Casual' && e.status === 'active').length;

  // If an employee is selected, show the employee profile
  if (selectedEmployee) {
    return <EmployeeProfile employee={selectedEmployee} onBack={() => setSelectedEmployee(null)} />;
  }

  return (
    <div className="p-4 pb-24">
      {showAddModal && <AddEmployeeModal onClose={() => setShowAddModal(false)} />}
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-gray-900">Employees</h1>
            </div>
          </div>
          <Button size="sm" className="gap-2 cursor-pointer" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4" />
            Add Employee
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs mb-1">Total Employees</div>
            <div className="text-gray-900 text-lg">{totalEmployees}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs mb-1">Permanent</div>
            <div className="text-gray-900 text-lg">{permanentEmployees}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs mb-1">Casual</div>
            <div className="text-gray-900 text-lg">{casualEmployees}</div>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Status Toggle */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setViewStatus('active')}
            className={`flex-1 px-4 py-3 text-sm transition-colors cursor-pointer ${
              viewStatus === 'active'
                ? 'bg-white text-gray-900 border-b-2 border-red-600'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setViewStatus('retired')}
            className={`flex-1 px-4 py-3 text-sm transition-colors cursor-pointer ${
              viewStatus === 'retired'
                ? 'bg-white text-gray-900 border-b-2 border-red-600'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            Retired
          </button>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden divide-y divide-gray-200">
          {filteredEmployees.map((employee) => (
            <button
              key={employee.id}
              onClick={() => setSelectedEmployee(employee)}
              className="w-full p-4 text-left hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-gray-900 mb-1">{employee.name}</h3>
                  <p className="text-sm text-gray-600">{employee.classification}</p>
                  <p className="text-sm text-gray-500 mt-1">{employee.employmentType}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Desktop Layout - Table */}
        <div className="hidden md:block">
          {/* Table Header */}
          <div className="grid grid-cols-7 gap-4 bg-gray-100 px-4 py-3 border-b border-gray-200 text-xs text-gray-600 uppercase tracking-wider">
            <div className="col-span-2">Name</div>
            <div className="col-span-2">Classification</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-1">Contact</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-gray-200">
            {filteredEmployees.map((employee) => (
              <button
                key={employee.id}
                onClick={() => setSelectedEmployee(employee)}
                className="w-full grid grid-cols-7 gap-4 items-center text-sm px-4 py-4 hover:bg-gray-50 transition-colors text-left cursor-pointer"
              >
                <div className="col-span-2 text-gray-900">{employee.name}</div>
                <div className="col-span-2 text-gray-500">{employee.classification}</div>
                <div className="col-span-2 text-gray-500">{employee.employmentType}</div>
                <div className="col-span-1 flex items-center gap-2">
                  {employee.email && (
                    <Mail className="w-4 h-4 text-gray-400" />
                  )}
                  {employee.phone && (
                    <Phone className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}