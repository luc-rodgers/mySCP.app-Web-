"use client"
import { Briefcase, Plus } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useState } from 'react';
import { ProjectProfile } from './ProjectProfile';

interface Project {
  id: string;
  name: string;
  client: string;
  address: string;
  status: 'active' | 'completed';
  startDate: string;
  endDate: string;
  hoursLogged: number;
  projectValue?: string;
}

interface ProjectsProps {
  initialProjects?: Project[];
}

export function Projects({ initialProjects }: ProjectsProps) {
  const [viewStatus, setViewStatus] = useState<'active' | 'retired'>('active');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const defaultProjects: Project[] = [
    {
      id: '1',
      name: 'Queens St, Southport',
      client: 'TBD',
      address: 'Southport, QLD',
      status: 'active',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      hoursLogged: 0,
      projectValue: '>$100m-$200m',
    },
    {
      id: '2',
      name: 'West Village - Calista',
      client: 'TBD',
      address: 'West End, QLD',
      status: 'active',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      hoursLogged: 0,
      projectValue: '>$80m-$100m',
    },
    {
      id: '3',
      name: 'West Village - Allere',
      client: 'TBD',
      address: 'West End, QLD',
      status: 'active',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      hoursLogged: 0,
      projectValue: '>$80m-$100m',
    },
    {
      id: '4',
      name: 'Cross River Rail',
      client: 'TBD',
      address: 'Brisbane, QLD',
      status: 'active',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      hoursLogged: 0,
      projectValue: '>$1b+',
    },
    {
      id: '5',
      name: 'Logan Hospital',
      client: 'TBD',
      address: 'Logan, QLD',
      status: 'active',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      hoursLogged: 0,
      projectValue: '>$200m-$500m',
    },
    {
      id: '6',
      name: 'Kallangur Hospital',
      client: 'TBD',
      address: 'Kallangur, QLD',
      status: 'active',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      hoursLogged: 0,
      projectValue: '>$100m-$200m',
    },
    {
      id: '7',
      name: 'Brooke St, Palm Beach',
      client: 'TBD',
      address: 'Palm Beach, QLD',
      status: 'active',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      hoursLogged: 0,
      projectValue: '>$50m-$80m',
    },
    {
      id: '8',
      name: 'Gatton Prison',
      client: 'TBD',
      address: 'Gatton, QLD',
      status: 'active',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      hoursLogged: 0,
      projectValue: '>$200m-$500m',
    },
    {
      id: '9',
      name: 'Placecrete - Kanagroo Point',
      client: 'Placecrete',
      address: 'Kangaroo Point, QLD',
      status: 'active',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      hoursLogged: 0,
      projectValue: '>$50m-$80m',
    },
    {
      id: '10',
      name: 'HB - Social Housing',
      client: 'Hutchinson Builders',
      address: 'Brisbane, QLD',
      status: 'active',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      hoursLogged: 0,
      projectValue: '>$100m-$200m',
    },
    {
      id: '11',
      name: 'QPS Brisbane Grammar',
      client: 'QPS',
      address: 'Brisbane, QLD',
      status: 'active',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      hoursLogged: 0,
      projectValue: '>$80m-$100m',
    },
    {
      id: '12',
      name: 'ZED - Bond Uni Robina',
      client: 'ZED',
      address: 'Robina, QLD',
      status: 'active',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      hoursLogged: 0,
      projectValue: '>$100m-$200m',
    },
    {
      id: '13',
      name: 'BUILT St Lucia',
      client: 'BUILT',
      address: 'St Lucia, QLD',
      status: 'active',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      hoursLogged: 0,
      projectValue: '>$80m-$100m',
    },
    {
      id: '14',
      name: 'General Beton - Meriton',
      client: 'General Beton',
      address: 'Brisbane, QLD',
      status: 'active',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      hoursLogged: 0,
      projectValue: '>$200m-$500m',
    },
    {
      id: '15',
      name: 'HB - Wharf St',
      client: 'Hutchinson Builders',
      address: 'Brisbane, QLD',
      status: 'active',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      hoursLogged: 0,
      projectValue: '>$100m-$200m',
    },
    {
      id: '16',
      name: 'Keybuild - Torbanlea',
      client: 'Keybuild',
      address: 'Torbanlea, QLD',
      status: 'active',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      hoursLogged: 0,
      projectValue: '>$50m-$80m',
    },
    {
      id: '17',
      name: 'ECCC - Coomeram Hospital',
      client: 'ECCC',
      address: 'Coomera, QLD',
      status: 'active',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      hoursLogged: 0,
      projectValue: '>$500m-$1b',
    },
    {
      id: '18',
      name: 'ECCC - Gold Coast University',
      client: 'ECCC',
      address: 'Gold Coast, QLD',
      status: 'active',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      hoursLogged: 0,
      projectValue: '>$200m-$500m',
    },
    {
      id: '19',
      name: 'McNab - Toowoomba',
      client: 'McNab',
      address: 'Toowoomba, QLD',
      status: 'active',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      hoursLogged: 0,
      projectValue: '>$80m-$100m',
    },
    {
      id: '20',
      name: 'HB - Quay Street',
      client: 'Hutchinson Builders',
      address: 'Brisbane, QLD',
      status: 'active',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      hoursLogged: 0,
      projectValue: '>$100m-$200m',
    },
    {
      id: '21',
      name: 'ECCC - Esprit',
      client: 'ECCC',
      address: 'Gold Coast, QLD',
      status: 'active',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      hoursLogged: 0,
      projectValue: '>$100m-$200m',
    },
    {
      id: '22',
      name: 'Monarch Toowong',
      client: 'Monarch',
      address: 'Toowong, QLD',
      status: 'active',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      hoursLogged: 0,
      projectValue: '>$80m-$100m',
    },
    {
      id: '23',
      name: 'Exhibition Quarter',
      client: 'TBD',
      address: 'Brisbane, QLD',
      status: 'active',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      hoursLogged: 0,
      projectValue: '>$500m-$1b',
    },
    {
      id: '24',
      name: 'Queens Wharf T5/6',
      client: 'TBD',
      address: 'Brisbane, QLD',
      status: 'active',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      hoursLogged: 0,
      projectValue: '>$1b+',
    },
    {
      id: '25',
      name: 'ECCC - Toowoomba Hospital',
      client: 'ECCC',
      address: 'Toowoomba, QLD',
      status: 'active',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      hoursLogged: 0,
      projectValue: '>$200m-$500m',
    },
    {
      id: '26',
      name: 'RDX Southport',
      client: 'RDX',
      address: 'Southport, QLD',
      status: 'active',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      hoursLogged: 0,
      projectValue: '>$100m-$200m',
    },
    {
      id: '27',
      name: 'Brisbane Square',
      client: 'Multiplex',
      address: 'Brisbane, QLD',
      status: 'completed',
      startDate: '2023-01-01',
      endDate: '2024-06-30',
      hoursLogged: 1245.5,
      projectValue: '>$500m-$1b',
    },
    {
      id: '28',
      name: 'Sunshine Coast Hospital',
      client: 'Lendlease',
      address: 'Sunshine Coast, QLD',
      status: 'completed',
      startDate: '2022-06-01',
      endDate: '2024-03-31',
      hoursLogged: 2156.0,
      projectValue: '>$1b+',
    },
    {
      id: '29',
      name: 'Victoria Bridge Upgrade',
      client: 'BMD',
      address: 'Brisbane, QLD',
      status: 'completed',
      startDate: '2023-03-01',
      endDate: '2024-09-30',
      hoursLogged: 987.5,
      projectValue: '>$200m-$500m',
    },
  ];

  const projects = initialProjects ?? defaultProjects;

  // Filter projects based on selected status
  const filteredProjects = projects.filter(project => project.status === viewStatus);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
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

  const totalHours = filteredProjects.reduce((sum, project) => sum + project.hoursLogged, 0);
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;

  // If a project is selected, show the project profile
  if (selectedProject) {
    return <ProjectProfile project={selectedProject} onBack={() => setSelectedProject(null)} />;
  }

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-gray-900">Projects</h1>
            </div>
          </div>
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Project
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs mb-1">Total Projects</div>
            <div className="text-gray-900 text-lg">{projects.length}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs mb-1">Active</div>
            <div className="text-green-600 text-lg">{activeProjects}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-gray-600 text-xs mb-1">Completed</div>
            <div className="text-blue-600 text-lg">{completedProjects}</div>
          </div>
        </div>
      </div>

      {/* Projects Table */}
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
          {filteredProjects.map((project) => (
            <button
              key={project.id}
              onClick={() => setSelectedProject(project)}
              className="w-full p-4 text-left hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-gray-900 mb-1">{project.name}</h3>
                  <p className="text-sm text-gray-600">{project.client}</p>
                </div>
                <Badge variant="outline" className={`${getStatusColor(project.status)} text-xs capitalize`}>
                  {project.status}
                </Badge>
              </div>
            </button>
          ))}
        </div>

        {/* Desktop Layout - Table */}
        <div className="hidden md:block">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 bg-gray-100 px-4 py-3 border-b border-gray-200 text-xs text-gray-600 uppercase tracking-wider">
            <div className="col-span-3">Project Name</div>
            <div className="col-span-2">Client</div>
            <div className="col-span-2">Location</div>
            <div className="col-span-2">$ Value</div>
            <div className="col-span-2">Date Range</div>
            <div className="col-span-1 text-right">Hrs</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-gray-200">
            {filteredProjects.map((project) => (
              <button
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className="w-full grid grid-cols-12 gap-4 items-center text-sm px-4 py-4 hover:bg-gray-50 transition-colors text-left cursor-pointer"
              >
                <div className="col-span-3 text-gray-900">{project.name}</div>
                <div className="col-span-2 text-gray-500">{project.client}</div>
                <div className="col-span-2 text-gray-500">{project.address}</div>
                <div className="col-span-2 text-gray-500">{project.projectValue || '-'}</div>
                <div className="col-span-2 text-gray-500">
                  <div>{formatDate(project.startDate)} -</div>
                  <div>{formatDate(project.endDate)}</div>
                </div>
                <div className="col-span-1 text-right text-gray-900">
                  {project.hoursLogged.toFixed(1)}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}