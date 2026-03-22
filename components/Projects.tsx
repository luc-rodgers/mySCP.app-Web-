"use client"
import { Settings } from 'lucide-react';
import { Badge } from './ui/badge';
import { useState, useRef, useEffect } from 'react';
import { ProjectProfile } from './ProjectProfile';
import { AddProjectModal } from './AddProjectModal';

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
  state?: string;
}

interface Client {
  id: string;
  name: string;
}

interface ProjectsProps {
  initialProjects: Project[];
  isAdmin?: boolean;
  clients?: Client[];
}

export function Projects({ initialProjects = [], isAdmin = false, clients = [] }: ProjectsProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [showCompleted, setShowCompleted] = useState(false);
  const [stateFilter, setStateFilter] = useState<'QLD' | 'NSW'>('QLD');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
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

  const stateProjects = projects.filter(p => !p.state || p.state === stateFilter);
  const filteredProjects = stateProjects.filter(p => p.status === (showCompleted ? 'completed' : 'active'));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const activeProjects = projects.filter(p => p.status === 'active').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;

  if (selectedProject) {
    return (
      <ProjectProfile
        project={selectedProject}
        onBack={() => setSelectedProject(null)}
        isAdmin={isAdmin}
        onUpdate={(updated) => {
          setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
          setSelectedProject(updated);
        }}
        onDeleted={() => {
          setProjects(prev => prev.filter(p => p.id !== selectedProject.id));
          setSelectedProject(null);
        }}
      />
    );
  }

  return (
    <div className="p-4 pb-24">
      {showAddModal && (
        <AddProjectModal clients={clients} onClose={() => setShowAddModal(false)} />
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-gray-900 font-bold">
            {showCompleted ? 'Completed Projects' : 'Projects'}
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
                    Add Project
                  </button>
                  <button
                    onClick={() => { setShowCompleted(!showCompleted); setShowMenu(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    {showCompleted ? 'Show Active Projects' : 'Show Completed Projects'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Overview</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
            <div className="text-[#374151] text-xl font-bold">{activeProjects}</div>
            <div className="text-gray-500 text-xs mt-0.5">Active</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
            <div className="text-[#374151] text-xl font-bold">{completedProjects}</div>
            <div className="text-gray-500 text-xs mt-0.5">Completed</div>
          </div>
        </div>
      </div>

      {/* State toggle */}
      <div className="bg-gray-100 rounded-xl p-1 flex mb-4">
        {(['QLD', 'NSW'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStateFilter(s)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
              stateFilter === s
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredProjects.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-gray-500">
            No {showCompleted ? 'completed' : 'active'} projects in {stateFilter}
          </div>
        )}

        {/* Mobile Layout */}
        <div className="md:hidden divide-y divide-gray-100">
          {filteredProjects.map((project) => (
            <button
              key={project.id}
              onClick={() => setSelectedProject(project)}
              className="w-full p-4 text-left hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-gray-900 mb-1">{project.name}</h3>
                  <p className="text-sm text-gray-500">{project.client}</p>
                </div>
                <Badge variant="outline" className={`${getStatusColor(project.status)} text-xs capitalize shrink-0`}>
                  {project.status}
                </Badge>
              </div>
            </button>
          ))}
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:block">
          <div className="grid grid-cols-12 gap-4 bg-gray-50 px-4 py-3 border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
            <div className="col-span-4">Project Name</div>
            <div className="col-span-2">Client</div>
            <div className="col-span-3">Location</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1 text-right">Hrs</div>
          </div>
          <div className="divide-y divide-gray-100">
            {filteredProjects.map((project) => (
              <button
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className="w-full grid grid-cols-12 gap-4 items-center text-sm px-4 py-4 hover:bg-gray-50 transition-colors text-left cursor-pointer"
              >
                <div className="col-span-4 text-gray-900">{project.name}</div>
                <div className="col-span-2 text-gray-500">{project.client}</div>
                <div className="col-span-3 text-gray-500">{project.address}</div>
                <div className="col-span-2">
                  <Badge variant="outline" className={`${getStatusColor(project.status)} text-xs capitalize`}>
                    {project.status}
                  </Badge>
                </div>
                <div className="col-span-1 text-right text-gray-500">
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
