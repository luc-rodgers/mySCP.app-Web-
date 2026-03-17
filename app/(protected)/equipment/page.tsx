import { createClient } from "@/lib/supabase/server";
import { Equipment } from "@/components/Equipment";

export default async function EquipmentPage() {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("equipment")
    .select("id, name, equipment_type, status, location, last_service, next_service, hours_used, active_status")
    .order("name");

  const initialEquipment = (rows ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    type: r.equipment_type ?? r.name,
    status: r.status ?? "Yard",
    location: r.location ?? "",
    lastMaintenance: r.last_service ?? "",
    nextMaintenance: r.next_service ?? "",
    hoursUsed: r.hours_used ?? 0,
    activeStatus: (r.active_status ?? "active") as "active" | "retired",
  }));

  return <Equipment initialEquipment={initialEquipment.length > 0 ? initialEquipment : undefined} />;
}
