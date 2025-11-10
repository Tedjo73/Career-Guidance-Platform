import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { GraduationCap, Building2, Briefcase, Users } from 'lucide-react';

interface LandingPageProps {
  onSelectRole: (role: 'login' | 'register') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSelectRole }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <GraduationCap className="w-20 h-20 text-blue-600" />
          </div>
          <h1 className="text-blue-900 mb-4">Career Gateway Lesotho</h1>
          <p className="text-gray-700 max-w-2xl mx-auto">
            Your comprehensive platform for higher education discovery, course applications, 
            and career placement in Lesotho. Connect students with institutions and employers.
          </p>
          
          <div className="flex justify-center gap-4 mt-8">
            <Button onClick={() => onSelectRole('login')} size="lg">
              Login
            </Button>
            <Button onClick={() => onSelectRole('register')} variant="outline" size="lg">
              Register
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>Students</CardTitle>
              <CardDescription>
                Discover institutions, apply for courses, and find employment opportunities
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>Institutions</CardTitle>
              <CardDescription>
                Manage courses, review applications, and admit qualified students
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Briefcase className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>Companies</CardTitle>
              <CardDescription>
                Post jobs and connect with qualified graduates automatically
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <GraduationCap className="w-6 h-6 text-orange-600" />
              </div>
              <CardTitle>Administration</CardTitle>
              <CardDescription>
                Manage the entire ecosystem of institutions, students, and companies
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Key Features */}
        <div className="mt-16 bg-white rounded-lg p-8 shadow-sm">
          <h2 className="text-gray-900 mb-6 text-center">Platform Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-gray-900 mb-2">For Students</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Browse higher learning institutions in Lesotho</li>
                <li>• Apply for up to 2 courses per institution</li>
                <li>• Track application status in real-time</li>
                <li>• Upload transcripts and certificates</li>
                <li>• Receive job notifications matching your profile</li>
                <li>• Choose between multiple admissions</li>
              </ul>
            </div>
            <div>
              <h3 className="text-gray-900 mb-2">For Institutions</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Add and manage faculties and courses</li>
                <li>• Review student applications</li>
                <li>• Publish admission results</li>
                <li>• Automated waiting list management</li>
                <li>• Student status tracking</li>
                <li>• Profile management</li>
              </ul>
            </div>
            <div>
              <h3 className="text-gray-900 mb-2">For Companies</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Post job opportunities with requirements</li>
                <li>• View pre-filtered qualified applicants</li>
                <li>• Automatic matching based on criteria</li>
                <li>• Access to academic performance data</li>
                <li>• Review work experience and certificates</li>
                <li>• Streamlined recruitment process</li>
              </ul>
            </div>
            <div>
              <h3 className="text-gray-900 mb-2">For Administrators</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Manage all institutions and courses</li>
                <li>• Approve company registrations</li>
                <li>• Monitor system activity</li>
                <li>• Generate comprehensive reports</li>
                <li>• Oversee admission processes</li>
                <li>• Platform-wide analytics</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
