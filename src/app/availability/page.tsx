import { AvailabilityView } from "@/features/availability/components/AvailabilityView";
import {
  getAllAvailability,
  getMembers,
} from "@/features/availability/server/store";

// Server Component: read the store directly for a first paint without a network hop.
export default function AvailabilityPage() {
  return (
    <AvailabilityView
      initialMembers={getMembers()}
      initialAvailability={getAllAvailability()}
    />
  );
}
