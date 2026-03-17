export interface SubActivity {
  id: string;
  type: string;
  activityType: string;
  start: string;
  finish: string;
}

export interface Project {
  id: string;
  type: string;
  project: string;
  siteStart: string;
  siteFinish: string;
  subActivities: SubActivity[];
  weather: boolean;
  weatherType?: string;
  weatherStart?: string;
  weatherEnd?: string;
  approvedBy?: string;
  lunch: boolean;
  lunchPenalty: boolean;
  lunchTime?: string;
  pumpClean: boolean;
  pumpCleanDuration?: string;
  rdoPayout?: string;
  rdoHold?: string;
  leaveType?: string;
  leaveStart?: string;
  leaveFinish?: string;
  leaveTotalHours?: string;
}

export interface TimeEntry {
  id: string;
  date: string;
  status: "draft" | "submitted" | "approved";
  depotStart: string;
  depotFinish: string;
  projects: Project[];
  remarks?: string;
  employeeName?: string;
  timeCardNumber?: string;
}

export type ProjectEntry = Project & {
  nonPourWork?: boolean;
};

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  classification: string;
  phone: string;
  startDate: string;
  avatar?: string;
  workStatus?: string;
}
