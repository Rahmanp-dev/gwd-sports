export const dynamic = "force-dynamic";

import MGFCStudentPage from "@/views/sections/MGFC/student/StudentPage";
import { RoleProtectedRoute } from "@/components/auth/RoleProtectedRoute";

export default function Page() {
  return (
    <RoleProtectedRoute allowedRoles={["student"]}>
      <MGFCStudentPage />
    </RoleProtectedRoute>
  );
}
