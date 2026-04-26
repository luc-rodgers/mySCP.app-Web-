"use client";

import { useState, useCallback } from "react";
import { TimeEntry, Project, SubActivity } from "@/lib/types";
import { TimeEntryCard } from "./TimeEntryCard";
import { createClient } from "@/lib/supabase/client";

type ProjectOption = { id: string; name: string };

interface Props {
  initialEntry: TimeEntry;
  employeeDbId: string;
  activeProjects: ProjectOption[];
  projectsByState?: { QLD: ProjectOption[]; NSW: ProjectOption[] };
  onClose: () => void;
  /** Open in view mode instead of edit mode */
  viewOnly?: boolean;
  /** Called after the entry is deleted */
  onDeleted?: () => void;
}

export function TimeEntryEditorModal({ initialEntry, employeeDbId, activeProjects, projectsByState, onClose, viewOnly = false, onDeleted }: Props) {
  const [entry, setEntry] = useState<TimeEntry>(initialEntry);

  const persist = useCallback(async (updated: TimeEntry) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("time_entries")
      .upsert({ id: updated.id, employee_id: employeeDbId, date: updated.date, status: updated.status, data: updated })
      .select("id, reference_number")
      .single();
    if (data && (data as any).reference_number && !updated.timeCardNumber) {
      setEntry(e => ({ ...e, timeCardNumber: (data as any).reference_number }));
    }
  }, [employeeDbId]);

  const handleUpdateEntry = (_id: string, updates: Partial<TimeEntry>) => {
    setEntry(e => { const u = { ...e, ...updates }; persist(u); return u; });
  };

  const handleStatusChange = async (_id: string, status: TimeEntry["status"]) => {
    setEntry(e => { const u = { ...e, status }; persist(u); return u; });
  };

  const handleAddProject = (_entryId: string, type: "project" | "yardwork" | "leave" = "project") => {
    setEntry(e => {
      let lastFinish = '';
      e.projects.forEach(p => {
        if (p.siteFinish && p.siteFinish > lastFinish) lastFinish = p.siteFinish;
        (p.subActivities || []).forEach(sa => {
          if (sa.finish && sa.finish > lastFinish) lastFinish = sa.finish;
        });
      });
      const defaultStart = lastFinish || e.depotStart || '';
      const newProject: Project = {
        id: `p${Date.now()}`, type, project: "", siteStart: defaultStart, siteFinish: "",
        subActivities: [], weather: false, lunch: false, lunchPenalty: false, pumpClean: false,
      };
      const u = { ...e, projects: [...e.projects, newProject] };
      persist(u);
      return u;
    });
  };

  const handleDeleteProject = (_entryId: string, projectId: string) => {
    setEntry(e => { const u = { ...e, projects: e.projects.filter(p => p.id !== projectId) }; persist(u); return u; });
  };

  const handleUpdateProject = (_entryId: string, projectId: string, updates: Partial<Project>) => {
    setEntry(e => {
      const u = { ...e, projects: e.projects.map(p => p.id === projectId ? { ...p, ...updates } : p) };
      persist(u); return u;
    });
  };

  const handleAddSubActivity = (_entryId: string, projectId: string, type: "pouring" | "non-pouring" | "travel") => {
    setEntry(e => {
      const proj = e.projects.find(p => p.id === projectId);
      const existing = proj?.subActivities || [];
      const defaultStart = existing.length === 0
        ? (e.depotStart || '')
        : (existing[existing.length - 1].finish || '');
      const sa: SubActivity = { id: `sa${Date.now()}`, type, activityType: "", start: defaultStart, finish: "" };
      const u = { ...e, projects: e.projects.map(p => p.id === projectId ? { ...p, subActivities: [...(p.subActivities || []), sa] } : p) };
      persist(u); return u;
    });
  };

  const handleUpdateSubActivity = (_entryId: string, projectId: string, saId: string, updates: Partial<SubActivity>) => {
    setEntry(e => {
      const u = { ...e, projects: e.projects.map(p => p.id === projectId ? { ...p, subActivities: (p.subActivities || []).map(sa => sa.id === saId ? { ...sa, ...updates } : sa) } : p) };
      persist(u); return u;
    });
  };

  const handleDeleteSubActivity = (_entryId: string, projectId: string, saId: string) => {
    setEntry(e => {
      const u = { ...e, projects: e.projects.map(p => p.id === projectId ? { ...p, subActivities: (p.subActivities || []).filter(sa => sa.id !== saId) } : p) };
      persist(u); return u;
    });
  };

  const handleDelete = async (_id: string) => {
    const supabase = createClient();
    await supabase.from("time_entries").delete().eq("id", entry.id);
    onDeleted?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50">
      <TimeEntryCard
        entry={entry}
        activeProjects={activeProjects}
        projectsByState={projectsByState}
        defaultOpen={!viewOnly}
        defaultSummaryOpen={viewOnly}
        defaultEditMode={!viewOnly}
        hideHeader={true}
        onModalClose={onClose}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
        onUpdateEntry={handleUpdateEntry}
        onAddProject={handleAddProject}
        onDeleteProject={handleDeleteProject}
        onUpdateProject={handleUpdateProject}
        onAddSubActivity={handleAddSubActivity}
        onUpdateSubActivity={handleUpdateSubActivity}
        onDeleteSubActivity={handleDeleteSubActivity}
      />
      {/* Fallback close if modal closes itself */}
      <div className="hidden" onClick={onClose} />
    </div>
  );
}
