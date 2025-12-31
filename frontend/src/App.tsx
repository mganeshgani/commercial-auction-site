import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuctionProvider } from './contexts/AuctionContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './layouts/Layout';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import PlayerRegistrationPage from './pages/PlayerRegistrationPage';
import FormBuilderPage from './pages/FormBuilderPage';
import AuctionPage from './pages/AuctionPage';
import TeamsPage from './pages/TeamsPage';
import PlayersPage from './pages/PlayersPage';
import UnsoldPage from './pages/UnsoldPage';
import ResultsPage from './pages/ResultsPage';
import AdminDashboard from './pages/AdminDashboard';
import AuctioneersPage from './pages/AuctioneersPage';
import './App.css';

// Role-based redirect component
const RoleBasedRedirect = () => {
  const { user } = useAuth();
  
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  return <Navigate to="/auction" replace />;
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AuctionProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/player-registration/:token" element={<PlayerRegistrationPage />} />
              
              {/* Root redirect based on role */}
              <Route path="/" element={
                <ProtectedRoute>
                  <RoleBasedRedirect />
                </ProtectedRoute>
              } />

              {/* Admin Routes - Only accessible by admin */}
              <Route path="/admin/*" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout>
                    <Routes>
                      <Route index element={<AdminDashboard />} />
                      <Route path="auctioneers" element={<AuctioneersPage />} />
                    </Routes>
                  </AdminLayout>
                </ProtectedRoute>
              } />

              {/* Auctioneer Routes - Accessible by auctioneers only (admin blocked) */}
              <Route path="/auction" element={
                <ProtectedRoute requiredRole="auctioneer">
                  <Layout>
                    <AuctionPage />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/teams" element={
                <ProtectedRoute requiredRole="auctioneer">
                  <Layout>
                    <TeamsPage />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/players" element={
                <ProtectedRoute requiredRole="auctioneer">
                  <Layout>
                    <PlayersPage />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/unsold" element={
                <ProtectedRoute requiredRole="auctioneer">
                  <Layout>
                    <UnsoldPage />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/results" element={
                <ProtectedRoute requiredRole="auctioneer">
                  <Layout>
                    <ResultsPage />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/form-builder" element={
                <ProtectedRoute requiredRole="auctioneer">
                  <Layout>
                    <FormBuilderPage />
                  </Layout>
                </ProtectedRoute>
              } />
            </Routes>
          </AuctionProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
