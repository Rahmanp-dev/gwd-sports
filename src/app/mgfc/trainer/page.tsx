export const dynamic = "force-dynamic";

import MGFCTrainerPage from "@/views/sections/MGFC/trainer/TrainerPage";
import { RoleProtectedRoute } from "@/components/auth/RoleProtectedRoute";

export default function Page() {
  return (
    <RoleProtectedRoute allowedRoles={["trainer"]}>
      <MGFCTrainerPage />
    </RoleProtectedRoute>
  );
}
