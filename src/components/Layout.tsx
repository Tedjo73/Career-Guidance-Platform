import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { logoutUser } from '../lib/auth';
import { Button } from './ui/button';
import { GraduationCap, LogOut, Menu } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, userProfile } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.success) {
      toast.success('Logged out successfully');
    } else {
      toast.error('Error logging out');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-8 h-8 text-blue-600" />
              <span className="text-blue-600">Career Gateway Lesotho</span>
            </div>

            {user && userProfile && (
              <div className="hidden md:flex items-center gap-4">
                <div className="text-right">
                  <div className="text-gray-900">{user.email}</div>
                  <div className="text-gray-500 text-sm capitalize">{userProfile.role}</div>
                </div>
                <Button onClick={handleLogout} variant="outline" size="sm">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            )}

            {user && (
              <button 
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && user && userProfile && (
            <div className="md:hidden py-4 border-t">
              <div className="text-gray-900 mb-2">{user.email}</div>
              <div className="text-gray-500 text-sm capitalize mb-4">{userProfile.role}</div>
              <Button onClick={handleLogout} variant="outline" size="sm" className="w-full">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-600">
            © 2025 Career Gateway Lesotho. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
