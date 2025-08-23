import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useAppDispatch } from '@/store';
import { logout } from '@/store/slices/authSlice';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="text-6xl font-bold text-red-400 mb-4">401</div>
          <CardTitle className="text-2xl text-gray-900">
            Access Denied
          </CardTitle>
          <CardDescription>
            You don't have permission to access this resource.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-700 text-sm">
              <strong>Admin privileges required.</strong><br />
              Please contact your administrator if you believe this is an error.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => navigate(-1)}
              variant="outline"
              className="w-full"
            >
              ← Go Back
            </Button>
            <Button 
              onClick={handleLogout}
              variant="destructive"
              className="w-full"
            >
              🔓 Logout & Login Again
            </Button>
            <Link to="/" className="w-full">
              <Button variant="outline" className="w-full">
                🏠 Home Page
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Unauthorized;