import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    fetchAuctioneers();
  }, []);

  const fetchAuctioneers = async () => {
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
  };

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Auctioneers Management</h1>
          <p className="text-slate-400">Manage auctioneer accounts and their access</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">
            Total: <span className="text-white font-semibold">{auctioneers.length}</span>
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Search</label>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500"
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
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Status Filter</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">All Auctioneers</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
              <option value="expired">Expired Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-700">
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Auctioneer
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Access Expiry
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Limits
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredAuctioneers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-500">
                      <svg className="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                      </svg>
                      <p>No auctioneers found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAuctioneers.map((auctioneer) => (
                  <tr 
                    key={auctioneer._id} 
                    className="group hover:bg-slate-900/50 transition-all cursor-pointer border-b border-slate-700/50 hover:border-red-500/30"
                    onClick={() => {
                      setSelectedAuctioneer(auctioneer);
                      setShowDetailModal(true);
                    }}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                          {auctioneer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white group-hover:text-red-400 transition-colors">{auctioneer.name}</div>
                          <div className="text-xs text-slate-500">{auctioneer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">{getStatusBadge(auctioneer)}</td>
                    <td className="px-6 py-5">
                      <div className="text-sm text-white font-medium">{formatDate(auctioneer.accessExpiry)}</div>
                      <div className="text-xs text-slate-500">
                        Joined {new Date(auctioneer.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-xs space-y-2">
                        <div className="flex items-center gap-2 text-slate-400">
                          <span>Players:</span>
                          <span className="text-white font-bold text-sm">
                            {auctioneer.limits.maxPlayers ?? '∞'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <span>Teams:</span>
                          <span className="text-white font-bold text-sm">
                            {auctioneer.limits.maxTeams ?? '∞'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-xs space-y-2">
                        <div className="flex items-center gap-2 text-slate-400">
                          <span>Players:</span>
                          <span className="text-emerald-400 font-bold text-sm">{auctioneer.usage.totalPlayers}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <span>Teams:</span>
                          <span className="text-blue-400 font-bold text-sm">{auctioneer.usage.totalTeams}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end">
                        <svg className="w-5 h-5 text-slate-600 group-hover:text-red-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      {selectedAuctioneer && (
        <AuctioneerDetailModal
          auctioneer={selectedAuctioneer}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedAuctioneer(null);
          }}
          onUpdate={fetchAuctioneers}
        />
      )}
    </div>
  );
};

export default AuctioneersPage;
