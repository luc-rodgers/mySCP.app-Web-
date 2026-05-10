import { Profile } from "@/components/Profile";
import { loadProfileData } from "../_lib/loadProfileData";

export default async function AnalyticsPage() {
  const { employee, emp, entries, activeProjects, projectsByState } = await loadProfileData();

  return (
    <Profile
      view="stats"
      employee={employee}
      entries={entries}
      employeeId={emp?.id ?? ""}
      employeeDbId={emp?.id ?? ""}
      activeProjects={activeProjects}
      projectsByState={projectsByState}
      firstName={emp?.first_name ?? ""}
      lastName={emp?.last_name ?? ""}
      classification={emp?.title ?? ""}
      employmentType={emp?.employment_type ?? "Casual"}
      role={emp?.role ?? "user"}
    />
  );
}
