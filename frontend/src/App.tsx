import React, { Suspense, lazy, memo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuctionProvider } from './contexts/AuctionContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Eagerly load Layout components to prevent header flash during navigation
import Layout from './layouts/Layout';
import AdminLayout from './layouts/AdminLayout';

// Lazy load all pages for code splitting (reduces initial bundle size)
const Login = lazy(() => import('./pages/Login'));
const PlayerRegistrationPage = lazy(() => import('./pages/PlayerRegistrationPage'));
const FormBuilderPage = lazy(() => import('./pages/FormBuilderPage'));
const AuctionPage = lazy(() => import('./pages/AuctionPage'));
const TeamsPage = lazy(() => import('./pages/TeamsPage'));
const PlayersPage = lazy(() => import('./pages/PlayersPage'));
const UnsoldPage = lazy(() => import('./pages/UnsoldPage'));
const ResultsPage = lazy(() => import('./pages/ResultsPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AuctioneersPage = lazy(() => import('./pages/AuctioneersPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

// Premium loading spinner component for page content - memoized to prevent re-renders
const PageLoadingSpinner = memo(() => (
  <div className="h-full w-full flex items-center justify-center" style={{
    minHeight: '400px'
  }}>
    <div className="text-center">
      <div className="relative inline-block">
        <div className="w-12 h-12 rounded-full border-4 border-t-amber-500 border-r-transparent border-b-amber-500/30 border-l-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 animate-pulse"></div>
        </div>
      </div>
      <p className="mt-3 text-amber-400/80 text-xs font-medium tracking-wider">Loading...</p>
    </div>
  </div>
));

// Full page loading spinner (for login/initial load)
const LoadingSpinner = memo(() => (
  <div className="h-screen w-screen flex items-center justify-center" style={{
    background: 'linear-gradient(160deg, #000000 0%, #0a0a0a 25%, #1a1a1a 50%, #0f172a 75%, #1a1a1a 100%)'
  }}>
    <div className="text-center">
      <div className="relative inline-block">
        <div className="w-16 h-16 rounded-full border-4 border-t-amber-500 border-r-transparent border-b-amber-500/30 border-l-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 animate-pulse"></div>
        </div>
      </div>
      <p className="mt-4 text-amber-400/80 text-sm font-medium tracking-wider">Loading...</p>
    </div>
  </div>
));

// Role-based redirect component
const RoleBasedRedirect = () => {
  const { user } = useAuth();
  
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  return <Navigate to="/auction" replace />;
};

// Wrapper components that use Outlet for nested routing - prevents Layout remounting
const AuctioneerLayoutWrapper = memo(() => (
  <ProtectedRoute requiredRole="auctioneer">
    <Layout>
      <Suspense fallback={<PageLoadingSpinner />}>
        <Outlet />
      </Suspense>
    </Layout>
  </ProtectedRoute>
));

const AdminLayoutWrapper = memo(() => (
  <ProtectedRoute requiredRole="admin">
    <AdminLayout>
      <Suspense fallback={<PageLoadingSpinner />}>
        <Outlet />
      </Suspense>
    </AdminLayout>
  </ProtectedRoute>
));

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AuctionProvider>
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={true}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="dark"
              style={{
                zIndex: 99999
              }}
            />
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Login />
                </Suspense>
              } />
              <Route path="/player-registration/:token" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <PlayerRegistrationPage />
                </Suspense>
              } />
              
              {/* Root redirect based on role */}
              <Route path="/" element={
                <ProtectedRoute>
                  <RoleBasedRedirect />
                </ProtectedRoute>
              } />

              {/* Admin Routes - Single Layout wrapper with nested routes */}
              <Route path="/admin" element={<AdminLayoutWrapper />}>
                <Route index element={<AdminDashboard />} />
                <Route path="auctioneers" element={<AuctioneersPage />} />
              </Route>

              {/* Auctioneer Routes - Single Layout wrapper with nested routes */}
              <Route element={<AuctioneerLayoutWrapper />}>
                <Route path="/auction" element={<AuctionPage />} />
                <Route path="/teams" element={<TeamsPage />} />
                <Route path="/players" element={<PlayersPage />} />
                <Route path="/unsold" element={<UnsoldPage />} />
                <Route path="/results" element={<ResultsPage />} />
                <Route path="/form-builder" element={<FormBuilderPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Routes>
          </AuctionProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
