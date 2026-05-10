import { Profile } from "@/components/Profile";
import { ClaimAdminButton } from "@/components/ClaimAdminButton";
import { loadProfileData } from "../_lib/loadProfileData";

export default async function ProfilePage() {
  const { employee, emp, entries, showClaimAdmin, activeProjects, projectsByState } = await loadProfileData();

  return (
    <div>
      {showClaimAdmin && (
        <div className="flex justify-end px-4 pt-4">
          <ClaimAdminButton />
        </div>
      )}
      <Profile
        view="profile"
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
        showClaimAdmin={showClaimAdmin}
      />
    </div>
  );
}
