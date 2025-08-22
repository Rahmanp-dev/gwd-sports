import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="text-6xl font-bold text-gray-400 mb-4">404</div>
          <CardTitle className="text-2xl text-gray-900">
            Page Not Found
          </CardTitle>
          <CardDescription>
            The page you're looking for doesn't exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-gray-600">
            <p>Here are some helpful links:</p>
          </div>
          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => navigate(-1)}
              variant="outline"
              className="w-full"
            >
              ← Go Back
            </Button>
            <Link to="/" className="w-full">
              <Button className="w-full">
                🏠 Home Page
              </Button>
            </Link>
            <Link to="/admin/login" className="w-full">
              <Button variant="outline" className="w-full">
                🔑 Admin Login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;