import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

interface Auctioneer {
  _id: string;
  name: string;
  email: string;
  isActive: boolean;
  accessExpiry: string | null;
  limits: {
    maxPlayers: number;
    maxTeams: number;
  };
  usage: {
    totalPlayers: number;
    totalTeams: number;
  };
  createdAt: string;
  lastLogin?: string;
}

interface AuctioneerDetailModalProps {
  auctioneer: Auctioneer;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const AuctioneerDetailModal: React.FC<AuctioneerDetailModalProps> = ({
  auctioneer,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'limits' | 'activity'>('overview');
  const [isEditingLimits, setIsEditingLimits] = useState(false);
  const [maxPlayers, setMaxPlayers] = useState(auctioneer.limits.maxPlayers);
  const [maxTeams, setMaxTeams] = useState(auctioneer.limits.maxTeams);
  const [accessDays, setAccessDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    setMaxPlayers(auctioneer.limits.maxPlayers);
    setMaxTeams(auctioneer.limits.maxTeams);
  }, [auctioneer]);

  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const handleUpdateLimits = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      const token = localStorage.getItem('token');
      await axios.put(
        `/api/admin/auctioneers/${auctioneer._id}`,
        {
          limits: {
            maxPlayers: Number(maxPlayers),
            maxTeams: Number(maxTeams),
          },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccessMessage('Limits updated successfully');
      setIsEditingLimits(false);
      onUpdate();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update limits');
    } finally {
      setLoading(false);
    }
  };

  const handleGrantAccess = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      const token = localStorage.getItem('token');
      await axios.post(
        `/api/admin/auctioneers/${auctioneer._id}/grant-access`,
        { days: accessDays },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccessMessage('Access granted successfully');
      onUpdate();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to grant access');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAccess = async () => {
    if (!window.confirm('Are you sure you want to revoke access for this auctioneer?')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      const token = localStorage.getItem('token');
      await axios.post(
        `/api/admin/auctioneers/${auctioneer._id}/revoke-access`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccessMessage('Access revoked successfully');
      onUpdate();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to revoke access');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this auctioneer? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/auctioneers/${auctioneer._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccessMessage('Auctioneer deleted successfully');
      onUpdate();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete auctioneer');
    } finally {
      setLoading(false);
    }
  };

  const playersPercentage = (auctioneer.usage.totalPlayers / auctioneer.limits.maxPlayers) * 100;
  const teamsPercentage = (auctioneer.usage.totalTeams / auctioneer.limits.maxTeams) * 100;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl border border-slate-700 overflow-hidden animate-scale-in">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl -translate-y-48 translate-x-48"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl translate-y-48 -translate-x-48"></div>

          {/* Header */}
          <div className="relative bg-gradient-to-r from-red-600 via-rose-600 to-red-700 p-8">
            <button
              onClick={onClose}
              className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all text-white hover:rotate-90 duration-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-start gap-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-2xl">
                {auctioneer.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-white mb-2">{auctioneer.name}</h2>
                <p className="text-red-100 text-lg mb-4">{auctioneer.email}</p>
                <div className="flex items-center gap-3">
                  {!auctioneer.isActive ? (
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-slate-600/30 text-slate-200 border border-slate-500/30 backdrop-blur-sm">
                      <span className="w-2 h-2 rounded-full bg-slate-400 mr-2 animate-pulse"></span>
                      Inactive
                    </span>
                  ) : isExpired(auctioneer.accessExpiry) ? (
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-amber-500/30 text-amber-200 border border-amber-400/30 backdrop-blur-sm">
                      <span className="w-2 h-2 rounded-full bg-amber-400 mr-2 animate-pulse"></span>
                      Expired
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 backdrop-blur-sm">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
                      Active
                    </span>
                  )}
                  {auctioneer.accessExpiry && (
                    <span className="text-sm text-red-100">
                      Expires: {format(new Date(auctioneer.accessExpiry), 'MMM dd, yyyy')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="relative grid grid-cols-4 gap-4 p-8 border-b border-slate-700">
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl p-5 border border-blue-500/30">
              <p className="text-sm text-blue-300 mb-1">Total Players</p>
              <p className="text-3xl font-bold text-white">{auctioneer.usage.totalPlayers}</p>
              <p className="text-xs text-blue-400 mt-1">of {auctioneer.limits.maxPlayers} limit</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-2xl p-5 border border-emerald-500/30">
              <p className="text-sm text-emerald-300 mb-1">Total Teams</p>
              <p className="text-3xl font-bold text-white">{auctioneer.usage.totalTeams}</p>
              <p className="text-xs text-emerald-400 mt-1">of {auctioneer.limits.maxTeams} limit</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-2xl p-5 border border-purple-500/30">
              <p className="text-sm text-purple-300 mb-1">Player Usage</p>
              <p className="text-3xl font-bold text-white">{Math.round(playersPercentage)}%</p>
              <div className="w-full bg-slate-700/50 rounded-full h-2 mt-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(playersPercentage, 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 rounded-2xl p-5 border border-cyan-500/30">
              <p className="text-sm text-cyan-300 mb-1">Team Usage</p>
              <p className="text-3xl font-bold text-white">{Math.round(teamsPercentage)}%</p>
              <div className="w-full bg-slate-700/50 rounded-full h-2 mt-2">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-cyan-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(teamsPercentage, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="relative border-b border-slate-700">
            <div className="flex gap-1 p-2 px-8">
              {[
                { id: 'overview', label: 'Overview', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
                { id: 'limits', label: 'Manage Limits', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' },
                { id: 'activity', label: 'Activity & Access', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-br from-red-600 to-rose-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="mx-8 mt-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="mx-8 mt-6 p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-200">
              {successMessage}
            </div>
          )}

          {/* Content */}
          <div className="relative p-8 min-h-[300px]">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Account Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-slate-400">Registered On</p>
                        <p className="text-white font-medium">
                          {format(new Date(auctioneer.createdAt), 'MMMM dd, yyyy')}
                        </p>
                      </div>
                      {auctioneer.lastLogin && (
                        <div>
                          <p className="text-sm text-slate-400">Last Login</p>
                          <p className="text-white font-medium">
                            {format(new Date(auctioneer.lastLogin), 'MMMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-slate-400">Account Status</p>
                        <p className="text-white font-medium">
                          {auctioneer.isActive ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Usage Statistics
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <p className="text-sm text-slate-400">Players</p>
                          <p className="text-white font-medium">
                            {auctioneer.usage.totalPlayers} / {auctioneer.limits.maxPlayers}
                          </p>
                        </div>
                        <div className="w-full bg-slate-700/50 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${
                              playersPercentage >= 90
                                ? 'bg-gradient-to-r from-red-500 to-red-600'
                                : playersPercentage >= 70
                                ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                                : 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                            }`}
                            style={{ width: `${Math.min(playersPercentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <p className="text-sm text-slate-400">Teams</p>
                          <p className="text-white font-medium">
                            {auctioneer.usage.totalTeams} / {auctioneer.limits.maxTeams}
                          </p>
                        </div>
                        <div className="w-full bg-slate-700/50 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${
                              teamsPercentage >= 90
                                ? 'bg-gradient-to-r from-red-500 to-red-600'
                                : teamsPercentage >= 70
                                ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                                : 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                            }`}
                            style={{ width: `${Math.min(teamsPercentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'limits' && (
              <div className="space-y-6">
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    Resource Limits
                  </h3>

                  {!isEditingLimits ? (
                    <div>
                      <div className="grid grid-cols-2 gap-6 mb-6">
                        <div>
                          <p className="text-sm text-slate-400 mb-2">Maximum Players</p>
                          <p className="text-3xl font-bold text-white">{auctioneer.limits.maxPlayers}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-400 mb-2">Maximum Teams</p>
                          <p className="text-3xl font-bold text-white">{auctioneer.limits.maxTeams}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsEditingLimits(true)}
                        className="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-red-500/30 transition-all"
                      >
                        Edit Limits
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="grid grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="block text-sm text-slate-400 mb-2">Maximum Players</label>
                          <input
                            type="number"
                            value={maxPlayers}
                            onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-slate-400 mb-2">Maximum Teams</label>
                          <input
                            type="number"
                            value={maxTeams}
                            onChange={(e) => setMaxTeams(parseInt(e.target.value))}
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                            min="1"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={handleUpdateLimits}
                          disabled={loading}
                          className="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-red-500/30 transition-all disabled:opacity-50"
                        >
                          {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingLimits(false);
                            setMaxPlayers(auctioneer.limits.maxPlayers);
                            setMaxTeams(auctioneer.limits.maxTeams);
                          }}
                          className="px-6 py-3 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-6">
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Access Management
                  </h3>

                  <div className="space-y-6">
                    {/* Grant Access */}
                    <div>
                      <label className="block text-sm text-slate-400 mb-3">Grant Access Duration (Days)</label>
                      <div className="flex gap-3">
                        <input
                          type="number"
                          value={accessDays}
                          onChange={(e) => setAccessDays(parseInt(e.target.value))}
                          className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                          min="1"
                          max="365"
                        />
                        <button
                          onClick={handleGrantAccess}
                          disabled={loading}
                          className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          {loading ? 'Processing...' : 'Grant Access'}
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        This will extend or set the access expiry date
                      </p>
                    </div>

                    {/* Current Status */}
                    <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-400">Current Access Status</p>
                          <p className="text-white font-medium mt-1">
                            {!auctioneer.isActive
                              ? 'Account Inactive'
                              : isExpired(auctioneer.accessExpiry)
                              ? 'Access Expired'
                              : 'Access Active'}
                          </p>
                          {auctioneer.accessExpiry && (
                            <p className="text-sm text-slate-500 mt-1">
                              Expires: {format(new Date(auctioneer.accessExpiry), 'MMMM dd, yyyy')}
                            </p>
                          )}
                        </div>
                        {auctioneer.isActive && (
                          <button
                            onClick={handleRevokeAccess}
                            disabled={loading}
                            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            Revoke Access
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-red-500/10 rounded-2xl p-6 border border-red-500/30">
                  <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Danger Zone
                  </h3>
                  <p className="text-slate-400 mb-4">
                    Deleting this auctioneer will permanently remove all their data including players, teams, and auction history. This action cannot be undone.
                  </p>
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {loading ? 'Deleting...' : 'Delete Auctioneer'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctioneerDetailModal;
