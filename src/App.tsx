import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { LandingPage } from './components/LandingPage';
import { AuthForms } from './components/AuthForms';
import { AdminDashboard } from './components/AdminDashboard';
import { InstituteDashboard } from './components/InstituteDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { CompanyDashboard } from './components/CompanyDashboard';
import { Toaster } from './components/ui/sonner';

function AppContent() {
  const { user, userProfile, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show landing page or auth forms
  if (!user) {
    if (authMode) {
      return <AuthForms initialMode={authMode} onBack={() => setAuthMode(null)} />;
    }
    return <LandingPage onSelectRole={setAuthMode} />;
  }

  // Email not verified
  if (!user.emailVerified && userProfile?.role !== 'admin') {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto p-6 mt-12">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <h2 className="text-yellow-900 mb-2">Email Verification Required</h2>
            <p className="text-yellow-700 mb-4">
              Please verify your email address to access your account. Check your inbox for the verification link.
            </p>
            <p className="text-yellow-600 text-sm">
              Didn't receive the email? Check your spam folder or contact support.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  // Account pending approval
  if (userProfile?.status === 'pending' && (userProfile?.role === 'company' || userProfile?.role === 'institute')) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto p-6 mt-12">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <h2 className="text-blue-900 mb-2">Account Pending Approval</h2>
            <p className="text-blue-700 mb-4">
              Your {userProfile.role} account is currently being reviewed by our administrators.
              You will receive an email notification once your account is approved.
            </p>
            <p className="text-blue-600 text-sm">
              This typically takes 1-2 business days.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  // Account rejected
  if (userProfile?.status === 'rejected') {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto p-6 mt-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-red-900 mb-2">Account Not Approved</h2>
            <p className="text-red-700 mb-4">
              Unfortunately, your account application was not approved. Please contact support for more information.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  // Render appropriate dashboard based on user role
  return (
    <Layout>
      {userProfile?.role === 'admin' && <AdminDashboard />}
      {userProfile?.role === 'institute' && <InstituteDashboard />}
      {userProfile?.role === 'student' && <StudentDashboard />}
      {userProfile?.role === 'company' && <CompanyDashboard />}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster />
    </AuthProvider>
  );
}
