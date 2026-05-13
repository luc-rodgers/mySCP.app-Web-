import { Profile } from "@/components/Profile";
import { TimeSheetHeader } from "@/components/TimeSheetHeader";
import DesktopTabToggle from "@/components/DesktopTabToggle";
import { loadProfileData, summariseHours } from "../_lib/loadProfileData";

export default async function AnalyticsPage() {
  const { employee, emp, entries, activeProjects, projectsByState, employeeForEdit, isAdmin } = await loadProfileData();
  const { todayHours, weekHours } = summariseHours(entries);

  return (
    <>
      <TimeSheetHeader
        todayHours={todayHours}
        weekHours={weekHours}
        employeeName={employee.name}
        employeeTitle={employee.classification}
        employeeForEdit={employeeForEdit}
        isAdmin={isAdmin}
      />
      <DesktopTabToggle />
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
    </>
  );
}
