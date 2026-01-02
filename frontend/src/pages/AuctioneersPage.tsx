import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AuctioneerDetailModal from '../components/AuctioneerDetailModal';

interface Auctioneer {
  _id: string;
  name: string;
  email: string;
  isActive: boolean;
  accessExpiry: string | null;
  createdAt: string;
  limits: {
    maxPlayers: number;
    maxTeams: number;
    maxAuctions?: number | null;
  };
  usage: {
    totalPlayers: number;
    totalTeams: number;
    totalAuctions?: number;
  };
}

const AuctioneersPage: React.FC = () => {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
  const [auctioneers, setAuctioneers] = useState<Auctioneer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');
  const [selectedAuctioneer, setSelectedAuctioneer] = useState<Auctioneer | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const fetchAuctioneers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/auctioneers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAuctioneers(response.data.data);
    } catch (error) {
      console.error('Failed to fetch auctioneers:', error);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchAuctioneers();
  }, [fetchAuctioneers]);

  const isExpired = (accessExpiry: string | null) => {
    if (!accessExpiry) return false;
    return new Date(accessExpiry) < new Date();
  };

  const getFilteredAuctioneers = () => {
    return auctioneers.filter((auctioneer) => {
      // Search filter
      const matchesSearch =
        auctioneer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auctioneer.email.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      let matchesStatus = true;
      if (filterStatus === 'active') {
        matchesStatus = auctioneer.isActive && !isExpired(auctioneer.accessExpiry);
      } else if (filterStatus === 'inactive') {
        matchesStatus = !auctioneer.isActive;
      } else if (filterStatus === 'expired') {
        matchesStatus = isExpired(auctioneer.accessExpiry);
      }

      return matchesSearch && matchesStatus;
    });
  };

  const handleCreateAuctioneer = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    // Validation
    if (createForm.password !== createForm.confirmPassword) {
      setCreateError('Passwords do not match');
      return;
    }

    if (createForm.password.length < 6) {
      setCreateError('Password must be at least 6 characters');
      return;
    }

    setCreating(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/admin/auctioneers/create`,
        {
          name: createForm.name,
          email: createForm.email,
          password: createForm.password,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      // Reset form and close modal
      setCreateForm({ name: '', email: '', password: '', confirmPassword: '' });
      setShowCreateModal(false);
      fetchAuctioneers();
    } catch (error: any) {
      setCreateError(error.response?.data?.error || 'Failed to create auctioneer');
    } finally {
      setCreating(false);
    }
  };



  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unlimited';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (auctioneer: Auctioneer) => {
    if (!auctioneer.isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">
          Inactive
        </span>
      );
    }
    if (isExpired(auctioneer.accessExpiry)) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">
          Expired
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
        Active
      </span>
    );
  };

  const filteredAuctioneers = getFilteredAuctioneers();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          <p className="text-slate-400">Loading auctioneers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white mb-0.5">Auctioneers Management</h1>
          <p className="text-slate-400 text-xs sm:text-sm">Manage auctioneer accounts and access</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-lg shadow-red-500/20 transform transition-all hover:scale-105"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span className="hidden sm:inline">Create </span>Auctioneer
          </button>
          <span className="text-xs sm:text-sm text-slate-400">
            Total: <span className="text-white font-semibold">{auctioneers.length}</span>
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 rounded-lg p-2.5 sm:p-3 border border-slate-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {/* Search */}
          <div>
            <label className="block text-[10px] sm:text-xs font-medium text-slate-300 mb-1 sm:mb-1.5">Search</label>
            <div className="relative">
              <svg
                className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-8 sm:pl-9 pr-2.5 sm:pr-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] sm:text-xs font-medium text-slate-300 mb-1 sm:mb-1.5">Status Filter</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">All Auctioneers</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
              <option value="expired">Expired Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Helpful Tip */}
      <div className="bg-gradient-to-r from-red-500/10 to-rose-500/10 border border-red-500/30 rounded-lg p-2.5 sm:p-3 flex items-center gap-2">
        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-[10px] sm:text-xs font-medium text-red-300">💡 Click any row to view details, edit limits, and manage access</p>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-700">
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Auctioneer
                </th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">
                  Access Expiry
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                  Limits
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                  Current Usage
                </th>
                <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-right text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredAuctioneers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 sm:px-4 py-6 sm:py-8 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <svg className="w-8 h-8 sm:w-10 sm:h-10 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                      </svg>
                      <p className="text-sm">No auctioneers found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAuctioneers.map((auctioneer) => (
                  <tr 
                    key={auctioneer._id} 
                    className="group hover:bg-slate-900/50 transition-all cursor-pointer border-b border-slate-700/50 hover:border-red-500/30"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAuctioneer(auctioneer);
                      setTimeout(() => setShowDetailModal(true), 0);
                    }}
                  >
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                      <div className="flex items-center gap-2 sm:gap-3 pointer-events-none">
                        <div className="w-7 h-7 sm:w-9 sm:h-9 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-lg group-hover:scale-110 transition-transform duration-300">
                          {auctioneer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-semibold text-white group-hover:text-red-400 transition-colors truncate max-w-[80px] sm:max-w-none">{auctioneer.name}</div>
                          <div className="text-[10px] sm:text-xs text-slate-500 truncate max-w-[80px] sm:max-w-none">{auctioneer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 pointer-events-none">{getStatusBadge(auctioneer)}</td>
                    <td className="px-4 py-3 pointer-events-none hidden md:table-cell">
                      <div className="text-sm text-white font-medium">{formatDate(auctioneer.accessExpiry)}</div>
                      <div className="text-xs text-slate-500">
                        Joined {new Date(auctioneer.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 pointer-events-none hidden lg:table-cell">
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-white font-semibold">{auctioneer.limits.maxPlayers ?? '∞'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span className="text-white font-semibold">{auctioneer.limits.maxTeams ?? '∞'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 pointer-events-none hidden lg:table-cell">
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded">
                          <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-emerald-400 font-bold">{auctioneer.usage.totalPlayers}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-blue-500/10 px-2 py-1 rounded">
                          <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span className="text-blue-400 font-bold">{auctioneer.usage.totalTeams}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 pointer-events-none">
                      <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                        <span className="text-[10px] sm:text-xs text-slate-500 group-hover:text-red-400 transition-colors font-medium">Details</span>
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 group-hover:text-red-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedAuctioneer && (
        <AuctioneerDetailModal
          auctioneer={selectedAuctioneer}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setTimeout(() => setSelectedAuctioneer(null), 300);
          }}
          onUpdate={() => {
            fetchAuctioneers();
          }}
        />
      )}

      {/* Create Auctioneer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md">
            {/* Header */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-white">Create New Auctioneer</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateForm({ name: '', email: '', password: '', confirmPassword: '' });
                    setCreateError('');
                  }}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateAuctioneer} className="px-4 sm:px-6 py-4 sm:py-5 space-y-3 sm:space-y-4">
              {createError && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 flex items-start gap-2 sm:gap-3">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-xs sm:text-sm text-red-300">{createError}</p>
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  placeholder="auctioneer@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={createForm.confirmPassword}
                  onChange={(e) => setCreateForm({ ...createForm, confirmPassword: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  placeholder="Re-enter password"
                />
              </div>

              <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateForm({ name: '', email: '', password: '', confirmPassword: '' });
                    setCreateError('');
                  }}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold rounded-lg shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctioneersPage;
