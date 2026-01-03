import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface DashboardStats {
  totalAuctioneers: number;
  activeAuctioneers: number;
  inactiveAuctioneers: number;
  expiredAuctioneers: number;
  totalPlayers: number;
  totalTeams: number;
}

interface Auctioneer {
  _id: string;
  name: string;
  email: string;
  isActive: boolean;
  accessExpiry: string | null;
  createdAt: string;
  limits: {
    maxPlayers: number | null;
    maxTeams: number | null;
    maxAuctions: number | null;
  };
  usage: {
    totalPlayers: number;
    totalTeams: number;
    totalAuctions: number;
  };
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
  const [stats, setStats] = useState<DashboardStats>({
    totalAuctioneers: 0,
    activeAuctioneers: 0,
    inactiveAuctioneers: 0,
    expiredAuctioneers: 0,
    totalPlayers: 0,
    totalTeams: 0,
  });
  const [recentAuctioneers, setRecentAuctioneers] = useState<Auctioneer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const [statsRes, auctioneersRes] = await Promise.all([
        axios.get(`${API_URL}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/admin/auctioneers`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (statsRes.data?.data) {
        setStats(statsRes.data.data);
      }
      if (auctioneersRes.data?.data && Array.isArray(auctioneersRes.data.data)) {
        setRecentAuctioneers(auctioneersRes.data.data.slice(0, 5));
      }
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isExpired = (accessExpiry: string | null) => {
    if (!accessExpiry) return false;
    return new Date(accessExpiry) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Welcome back, {user?.name}
        </h1>
        <p className="text-slate-600 mt-1">Here's what's happening with your platform today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Users */}
        <div className="bg-white rounded-lg p-4 border border-slate-200 hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-600 mb-1">Total Users</p>
              <p className="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{stats.totalAuctioneers}</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-xl">👥</span>
            </div>
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-white rounded-lg p-4 border border-slate-200 hover:shadow-lg hover:border-green-200 transition-all cursor-pointer group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-600 mb-1">Active</p>
              <p className="text-2xl font-bold text-green-600 group-hover:scale-105 transition-transform">{stats.activeAuctioneers}</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-green-50 to-green-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-xl">✓</span>
            </div>
          </div>
        </div>

        {/* Total Players */}
        <div className="bg-white rounded-lg p-4 border border-slate-200 hover:shadow-lg hover:border-purple-200 transition-all cursor-pointer group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-600 mb-1">Players</p>
              <p className="text-2xl font-bold text-slate-900 group-hover:text-purple-600 transition-colors">{stats.totalPlayers}</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-xl">⚽</span>
            </div>
          </div>
        </div>

        {/* Total Teams */}
        <div className="bg-white rounded-lg p-4 border border-slate-200 hover:shadow-lg hover:border-orange-200 transition-all cursor-pointer group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-600 mb-1">Teams</p>
              <p className="text-2xl font-bold text-slate-900 group-hover:text-orange-600 transition-colors">{stats.totalTeams}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🏆</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg p-4 border border-slate-200">
        <h2 className="text-base font-bold text-slate-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Link
            to="/admin/auctioneers"
            className="flex items-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
          >
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Add New User</h3>
              <p className="text-xs text-slate-600">Create auctioneer account</p>
            </div>
          </Link>

          <Link
            to="/admin/auctioneers"
            className="flex items-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors group"
          >
            <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Manage Users</h3>
              <p className="text-xs text-slate-600">View all auctioneers</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Recent Users</h2>
          <Link
            to="/admin/auctioneers"
            className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            View all →
          </Link>
        </div>

        {recentAuctioneers.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">📭</span>
            </div>
            <p className="text-sm text-slate-600">No users registered yet</p>
            <p className="text-xs text-slate-500 mt-1">New registrations will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 max-h-[300px] overflow-y-auto">
            {recentAuctioneers.map((auctioneer) => (
              <Link
                key={auctioneer._id}
                to="/admin/auctioneers"
                className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {auctioneer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {auctioneer.name}
                    </h3>
                    <p className="text-xs text-slate-600">{auctioneer.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-4 text-xs">
                    <div className="text-center">
                      <p className="font-semibold text-slate-900">{auctioneer.usage.totalPlayers}</p>
                      <p className="text-slate-600">Players</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-slate-900">{auctioneer.usage.totalTeams}</p>
                      <p className="text-slate-600">Teams</p>
                    </div>
                  </div>
                  {!auctioneer.isActive ? (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                      Inactive
                    </span>
                  ) : isExpired(auctioneer.accessExpiry) ? (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-600">
                      Expired
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">
                      Active
                    </span>
                  )}
                  <svg className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
