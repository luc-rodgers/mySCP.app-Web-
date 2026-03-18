"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { EditEmployeeModal } from "./EditEmployeeModal";

interface Props {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  classification: string;
  employmentType: string;
  role: string;
  isAdmin: boolean;
}

export function ProfileEditButton({
  employeeId,
  firstName,
  lastName,
  email,
  phone,
  classification,
  employmentType,
  role,
  isAdmin,
}: Props) {
  const [showEdit, setShowEdit] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowEdit(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <Pencil className="w-4 h-4" />
        Edit Profile
      </button>

      {showEdit && (
        <EditEmployeeModal
          employee={{
            id: employeeId,
            firstName,
            lastName,
            email,
            phone,
            classification,
            employmentType,
            role,
            activeStatus: "active",
          }}
          isAdmin={isAdmin}
          onClose={() => setShowEdit(false)}
        />
      )}
    </>
  );
}
