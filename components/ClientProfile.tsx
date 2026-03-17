"use client"
import { ArrowLeft, MapPin, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useState } from 'react';
import { ProjectProfile } from './ProjectProfile';

interface Client {
  id: string;
  name: string;
  contact: string;
  address: string;
  projectValue: string;
  activeProjects: number;
}

interface ProjectEntry {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  hoursLogged: number;
}

interface ProjectForProfile {
  id: string;
  name: string;
  client: string;
  address: string;
  status: string;
  startDate: string;
  endDate: string;
  hoursLogged: number;
}

interface ClientProfileProps {
  client: Client;
  onBack: () => void;
}

export function ClientProfile({ client, onBack }: ClientProfileProps) {
  const [selectedProject, setSelectedProject] = useState<ProjectForProfile | null>(null);

  // Sample projects for the client
  const projects: ProjectEntry[] = [
    {
      id: '1',
      name: 'Downtown Office Tower',
      status: 'active',
      startDate: '2025-11-01',
      endDate: '2025-12-15',
      hoursLogged: 145.5,
    },
    {
      id: '2',
      name: 'North Campus Expansion',
      status: 'active',
      startDate: '2025-10-15',
      endDate: '2025-11-30',
      hoursLogged: 89.0,
    },
    {
      id: '3',
      name: 'Warehouse Renovation',
      status: 'completed',
      startDate: '2025-09-01',
      endDate: '2025-10-20',
      hoursLogged: 234.5,
    },
  ];

  const handleProjectClick = (project: ProjectEntry) => {
    // Convert ProjectEntry to ProjectForProfile format
    const projectForProfile: ProjectForProfile = {
      id: project.id,
      name: project.name,
      client: client.name,
      address: client.address,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      hoursLogged: project.hoursLogged,
    };
    setSelectedProject(projectForProfile);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'planning':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const totalProjects = projects.length;
  const activeProjectsCount = projects.filter(p => p.status === 'active').length;
  const totalHours = projects.reduce((sum, project) => sum + project.hoursLogged, 0);

  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  // If a project is selected, show the project profile
  if (selectedProject) {
    return <ProjectProfile project={selectedProject} onBack={() => setSelectedProject(null)} />;
  }

  return (
    <div className="p-4 pb-24">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="mb-4 gap-2 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Clients
      </Button>

      {/* Client Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-gray-900">{client.name}</h1>
            </div>
            <p className="text-sm text-gray-500 mb-4">Contact: {client.contact}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
              <div className="flex items-center gap-2 text-gray-600 md:col-span-2">
                <MapPin className="w-4 h-4" />
                <span>{client.address}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm bg-green-50 px-3 py-2 rounded border border-green-200 w-fit">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-gray-600">Total Value:</span>
              <span className="text-gray-900">{client.projectValue}</span>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs mb-1">Total Projects</div>
            <div className="text-blue-600 text-lg">{totalProjects}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs mb-1">Active</div>
            <div className="text-green-600 text-lg">{activeProjectsCount}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs mb-1">Total Hours</div>
            <div className="text-blue-600 text-lg">{totalHours.toFixed(0)}</div>
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h2 className="text-gray-900">Projects</h2>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden divide-y divide-gray-200">
          {projects.map((project) => {
            const isExpanded = expandedProjects.has(project.id);
            return (
              <div key={project.id} className="p-4">
                {/* Simplified View */}
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <h3 
                      className="text-gray-900 mb-1 cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => handleProjectClick(project)}
                    >
                      {project.name}
                    </h3>
                    <Badge variant="outline" className={`${getStatusColor(project.status)} text-xs capitalize`}>
                      {project.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">{project.hoursLogged.toFixed(1)} hrs</span>
                    <button
                      onClick={() => toggleProject(project.id)}
                      className="cursor-pointer"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-200 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start Date:</span>
                      <span className="text-gray-900">{formatDate(project.startDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">End Date:</span>
                      <span className="text-gray-900">{formatDate(project.endDate)}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Desktop Layout - Table */}
        <div className="hidden md:block">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 bg-gray-100 px-4 py-3 border-b border-gray-200 text-xs text-gray-600 uppercase tracking-wider">
            <div className="col-span-1">Status</div>
            <div className="col-span-4">Project Name</div>
            <div className="col-span-3">Start Date</div>
            <div className="col-span-3">End Date</div>
            <div className="col-span-1 text-right">Hours</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-gray-200">
            {projects.map((project) => (
              <div 
                key={project.id} 
                className="grid grid-cols-12 gap-4 items-center text-sm px-4 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleProjectClick(project)}
              >
                <div className="col-span-1">
                  <Badge variant="outline" className={`${getStatusColor(project.status)} text-xs capitalize`}>
                    {project.status}
                  </Badge>
                </div>
                <div className="col-span-4 text-gray-900">
                  {project.name}
                </div>
                <div className="col-span-3 text-gray-500">{formatDate(project.startDate)}</div>
                <div className="col-span-3 text-gray-500">{formatDate(project.endDate)}</div>
                <div className="col-span-1 text-right text-blue-600">
                  {project.hoursLogged.toFixed(1)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}