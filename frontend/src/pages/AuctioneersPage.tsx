import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
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
      toast.error('Failed to load users');
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

    // Validation
    if (createForm.password !== createForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (createForm.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setCreating(true);
    const toastId = toast.loading('Creating user...');
    
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
      
      toast.update(toastId, {
        render: 'User created successfully!',
        type: 'success',
        isLoading: false,
        autoClose: 2000,
      });
      
      // Reset form and close modal
      setCreateForm({ name: '', email: '', password: '', confirmPassword: '' });
      setShowCreateModal(false);
      fetchAuctioneers();
    } catch (error: any) {
      toast.update(toastId, {
        render: error.response?.data?.error || 'Failed to create user',
        type: 'error',
        isLoading: false,
        autoClose: 3000,
      });
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

  const filteredAuctioneers = getFilteredAuctioneers();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 text-sm">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Users</h1>
          <p className="text-slate-600 mt-1">Manage auctioneer accounts and access</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-105"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add User
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400"
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
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="sm:w-48">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Users</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* User Cards Grid */}
      {filteredAuctioneers.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-slate-200 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">👤</span>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No users found</h3>
          <p className="text-slate-600">
            {searchTerm || filterStatus !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Create your first user to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAuctioneers.map((auctioneer) => (
            <div
              key={auctioneer._id}
              onClick={() => {
                setSelectedAuctioneer(auctioneer);
                setShowDetailModal(true);
              }}
              className="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group"
            >
              {/* User Avatar and Status */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform">
                    {auctioneer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {auctioneer.name}
                    </h3>
                    <p className="text-sm text-slate-600 truncate max-w-[150px]">{auctioneer.email}</p>
                  </div>
                </div>
                {!auctioneer.isActive ? (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                    Inactive
                  </span>
                ) : isExpired(auctioneer.accessExpiry) ? (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-600">
                    Expired
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">
                    Active
                  </span>
                )}
              </div>

              {/* Usage Stats with Limits */}
              <div className="space-y-3 mb-3">
                {/* Players */}
                <div className="bg-slate-50 rounded-lg p-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">⚽</span>
                      <span className="text-xs font-medium text-slate-700">Players</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">
                      {auctioneer.usage.totalPlayers} / {auctioneer.limits.maxPlayers || '∞'}
                    </span>
                  </div>
                  {auctioneer.limits.maxPlayers && auctioneer.limits.maxPlayers > 0 && (
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.min((auctioneer.usage.totalPlayers / auctioneer.limits.maxPlayers) * 100, 100)}%` }}
                      ></div>
                    </div>
                  )}
                </div>

                {/* Teams */}
                <div className="bg-slate-50 rounded-lg p-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">🏆</span>
                      <span className="text-xs font-medium text-slate-700">Teams</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">
                      {auctioneer.usage.totalTeams} / {auctioneer.limits.maxTeams || '∞'}
                    </span>
                  </div>
                  {auctioneer.limits.maxTeams && auctioneer.limits.maxTeams > 0 && (
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.min((auctioneer.usage.totalTeams / auctioneer.limits.maxTeams) * 100, 100)}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Access & Member Info */}
              <div className="space-y-2 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Access Expires</span>
                  <span className="text-xs font-medium text-slate-900">{formatDate(auctioneer.accessExpiry)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Member Since</span>
                  <span className="text-xs font-medium text-slate-900">{new Date(auctioneer.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Manage Button */}
              <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-blue-600 group-hover:text-blue-700 font-medium">
                <span>Manage Account</span>
                <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}

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

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Create New User</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateForm({ name: '', email: '', password: '', confirmPassword: '' });
                  }}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateAuctioneer} className="px-6 py-5 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={createForm.confirmPassword}
                  onChange={(e) => setCreateForm({ ...createForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Re-enter password"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateForm({ name: '', email: '', password: '', confirmPassword: '' });
                  }}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {creating ? 'Creating...' : 'Create User'}
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
