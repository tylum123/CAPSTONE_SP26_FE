import { FarmerDashboard } from "@/components/farmer/farmer-dashboard";
import { FarmerLayout } from "@/components/farmer/farmer-layout";

export default function FarmerPage() {
  return (
    <FarmerLayout>
      <FarmerDashboard />
    </FarmerLayout>
  );
}
