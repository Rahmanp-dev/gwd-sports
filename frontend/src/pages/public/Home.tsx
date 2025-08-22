import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { APP_NAME } from '@/utils/constants';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to {APP_NAME}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Comprehensive sports academy management system for students, trainers, and administrators.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-2xl text-blue-600">
                🎓 For Students
              </CardTitle>
              <CardDescription>
                Track your progress, manage schedules, and connect with trainers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-left space-y-2 text-gray-600">
                <li>• View performance analytics</li>
                <li>• Schedule training sessions</li>
                <li>• Request equipment kits</li>
                <li>• Track attendance</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-2xl text-green-600">
                🏃‍♂️ For Trainers
              </CardTitle>
              <CardDescription>
                Manage students, track progress, and optimize training programs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-left space-y-2 text-gray-600">
                <li>• Student management</li>
                <li>• Performance tracking</li>
                <li>• Attendance marking</li>
                <li>• Academy collaboration</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-2xl text-purple-600">
                ⚙️ For Admins
              </CardTitle>
              <CardDescription>
                Complete system oversight and management capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-left space-y-2 text-gray-600">
                <li>• User management</li>
                <li>• Academy oversight</li>
                <li>• System analytics</li>
                <li>• Event coordination</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to get started?
            </h2>
            <p className="text-gray-600 mb-6">
              Access the admin panel to manage your sports academy
            </p>
            <Link to="/admin/login">
              <Button size="lg" className="w-full">
                Admin Login
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-500">
          <p>© 2024 {APP_NAME}. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default Home;