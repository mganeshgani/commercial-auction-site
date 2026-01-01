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
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Welcome Banner */}
      <div className="relative bg-gradient-to-br from-red-600 via-rose-600 to-red-700 rounded-xl p-5 shadow-xl overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-24 translate-x-24"></div>
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-white/5 rounded-full translate-y-18 -translate-x-18"></div>
        
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">
              Welcome back, {user?.name}
            </h1>
            <p className="text-red-100 text-sm">
              Manage your auction platform efficiently
            </p>
          </div>
          <div className="hidden md:flex items-center justify-center w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl border border-white/20">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Auctioneers */}
        <div className="group bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 border border-slate-700 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-white">{stats.totalAuctioneers}</p>
              <p className="text-xs text-blue-400 font-medium">Total</p>
            </div>
          </div>
          <h3 className="text-slate-300 text-xs font-medium">Registered Users</h3>
        </div>

        {/* Active Auctioneers */}
        <div className="group bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 border border-slate-700 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-white">{stats.activeAuctioneers}</p>
              <p className="text-xs text-emerald-400 font-medium">Active</p>
            </div>
          </div>
          <h3 className="text-slate-300 text-xs font-medium">Currently Enabled</h3>
        </div>

        {/* Inactive Auctioneers */}
        <div className="group bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 border border-slate-700 hover:border-slate-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-slate-500/10">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-white">{stats.inactiveAuctioneers}</p>
              <p className="text-xs text-slate-400 font-medium">Inactive</p>
            </div>
          </div>
          <h3 className="text-slate-300 text-xs font-medium">Disabled Accounts</h3>
        </div>

        {/* Expired Auctioneers */}
        <div className="group bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 border border-slate-700 hover:border-amber-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-white">{stats.expiredAuctioneers}</p>
              <p className="text-xs text-amber-400 font-medium">Expired</p>
            </div>
          </div>
          <h3 className="text-slate-300 text-xs font-medium">Need Renewal</h3>
        </div>

        {/* Total Players */}
        <div className="group bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 border border-slate-700 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-white">{stats.totalPlayers}</p>
              <p className="text-xs text-purple-400 font-medium">Players</p>
            </div>
          </div>
          <h3 className="text-slate-300 text-xs font-medium">Platform Wide</h3>
        </div>

        {/* Total Teams */}
        <div className="group bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 border border-slate-700 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-white">{stats.totalTeams}</p>
              <p className="text-xs text-cyan-400 font-medium">Teams</p>
            </div>
          </div>
          <h3 className="text-slate-300 text-xs font-medium">Created Globally</h3>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-5 border border-slate-700 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            Recent Auctioneers
          </h2>
          <Link
            to="/admin/auctioneers"
            className="group flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors font-medium"
          >
            <span>View All</span>
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {recentAuctioneers.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-lg">No auctioneers registered yet</p>
            <p className="text-sm text-slate-600 mt-2">New users will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentAuctioneers.map((auctioneer) => (
              <Link
                key={auctioneer._id}
                to="/admin/auctioneers"
                className="group flex items-center justify-between p-5 bg-slate-900/50 rounded-xl border border-slate-700/50 hover:border-red-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/5"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                    {auctioneer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white group-hover:text-red-400 transition-colors">
                      {auctioneer.name}
                    </h3>
                    <p className="text-sm text-slate-500">{auctioneer.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="hidden sm:flex items-center gap-4 text-right">
                    <div>
                      <p className="text-xs text-slate-500">Players</p>
                      <p className="text-lg font-bold text-white">{auctioneer.usage.totalPlayers}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Teams</p>
                      <p className="text-lg font-bold text-white">{auctioneer.usage.totalTeams}</p>
                    </div>
                  </div>
                  <div>
                    {!auctioneer.isActive ? (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-600/20 text-slate-400 border border-slate-600/30">
                        Inactive
                      </span>
                    ) : isExpired(auctioneer.accessExpiry) ? (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        Expired
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Active
                      </span>
                    )}
                  </div>
                  <svg className="w-5 h-5 text-slate-600 group-hover:text-red-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
