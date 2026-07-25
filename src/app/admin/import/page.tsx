export const dynamic = 'force-dynamic';
import PageComponent from "@/views/admin/ImportPage";
import { AdminProtectedRoute } from "@/components/auth/AdminProtectedRoute";

export default function Page() {
  return (
    <AdminProtectedRoute>
      <PageComponent />
    </AdminProtectedRoute>
  );
}
