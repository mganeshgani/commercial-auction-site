import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'auctioneer';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-amber-400 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (requiredRole) {
    if (requiredRole === 'admin' && user?.role !== 'admin') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-8 max-w-md text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h2>
            <p className="text-gray-300 mb-6">
              You don't have permission to access this page. Admin access required.
            </p>
            <Navigate to="/" replace />
          </div>
        </div>
      );
    }

    // Auctioneer routes - block admin from accessing
    if (requiredRole === 'auctioneer' && user?.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }

    if (requiredRole === 'auctioneer' && user?.role !== 'auctioneer') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-8 max-w-md text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h2>
            <p className="text-gray-300 mb-6">
              You don't have permission to access this page. Auctioneer access required.
            </p>
            <Navigate to="/" replace />
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
