export const dynamic = "force-dynamic";

import PayFeesPage from "@/views/sections/MGFC/student/PayFeesPage";
import { RoleProtectedRoute } from "@/components/auth/RoleProtectedRoute";

export default function Page() {
  return (
    <RoleProtectedRoute allowedRoles={["student"]}>
      <PayFeesPage />
    </RoleProtectedRoute>
  );
}
