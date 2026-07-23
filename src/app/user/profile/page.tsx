export const dynamic = 'force-dynamic';
import PageComponent from "@/views/user/UserProfile";
import { UserProtectedRoute } from "@/components/auth/UserProtectedRoute";

export default function Page() {
  return (
    <UserProtectedRoute>
      <PageComponent />
    </UserProtectedRoute>
  );
}
