import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Player } from '../types';
import RegistrationLinkGenerator from '../components/RegistrationLinkGenerator';
import EditPlayerModal from '../components/EditPlayerModal';
import { useAuth } from '../contexts/AuthContext';
import { playerService, clearCache } from '../services/api';
import { initializeSocket } from '../services/socket';

const PlayersPage: React.FC = () => {
  const { isAuctioneer, user } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'available' | 'sold' | 'unsold'>('all');
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const BACKEND_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5001';

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await playerService.getAllPlayers(true); // Use cache
      setPlayers(data);
      
      // Debug: Log first player's photo URL to check conversion
      if (data.length > 0 && data[0].photoUrl) {
        console.log('✓ Sample Photo URL:', data[0].photoUrl);
        console.log('✓ Player Name:', data[0].name);
      }
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  // Socket.IO listener for real-time player updates
  useEffect(() => {
    const socket = initializeSocket();

    // Listen for playerAdded event
    socket.on('playerAdded', (newPlayer: Player) => {
      console.log('✓ Player added via socket:', newPlayer.name);
      clearCache(); // Clear cache to fetch fresh data
      fetchPlayers(); // Refresh the list
    });

    // Listen for playerUpdated event
    socket.on('playerUpdated', (updatedPlayer: Player) => {
      console.log('✓ Player updated via socket:', updatedPlayer.name);
      clearCache();
      fetchPlayers();
    });

    // Cleanup on unmount
    return () => {
      socket.off('playerAdded');
      socket.off('playerUpdated');
    };
  }, [fetchPlayers]);

  const handleDeletePlayer = useCallback(async (playerId: string) => {
    if (!window.confirm('Are you sure you want to delete this player? This action cannot be undone.')) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${BACKEND_URL}/api/players/${playerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      clearCache(); // Clear cache after deletion
      fetchPlayers();
    } catch (error: any) {
      console.error('Error deleting player:', error);
      const errorMessage = error.response?.data?.error || 'Failed to delete player';
      alert(errorMessage);
    }
  }, [BACKEND_URL, fetchPlayers]);

  const filteredPlayers = useMemo(() => 
    filter === 'all' 
      ? players 
      : players.filter(p => p.status === filter),
    [filter, players]
  );

  const statusConfig = {
    available: { 
      bg: 'bg-green-500/20', 
      border: 'border-green-500/30', 
      text: 'text-green-400',
      icon: '✓'
    },
    sold: { 
      bg: 'bg-blue-500/20', 
      border: 'border-blue-500/30', 
      text: 'text-blue-400',
      icon: '💰'
    },
    unsold: { 
      bg: 'bg-red-500/20', 
      border: 'border-red-500/30', 
      text: 'text-red-400',
      icon: '✗'
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Ultra-Compact Premium Header */}
      <div className="relative flex-shrink-0 border-b px-2 sm:px-4 py-1.5 sm:py-2 overflow-hidden" style={{
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(13, 17, 23, 0.9) 50%, rgba(0, 0, 0, 0.95) 100%)',
        borderBottom: '1.5px solid rgba(212, 175, 55, 0.3)',
        boxShadow: '0 2px 20px rgba(0, 0, 0, 0.6), 0 0 30px rgba(212, 175, 55, 0.08)'
      }}>
        {/* Subtle Background Animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
          <div className="aurora-bg-header"></div>
          <div className="floating-orbs-header">
            <div className="orb-header orb-header-1"></div>
            <div className="orb-header orb-header-2"></div>
            <div className="orb-header orb-header-3"></div>
          </div>
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          {/* Title - Compact */}
          <div className="flex items-center gap-2 flex-1">
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight leading-none" style={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #F0D770 50%, #D4AF37 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: '0 0 30px rgba(212, 175, 55, 0.3)'
              }}>Players Management</h1>
              <p className="text-gray-400 text-[10px] sm:text-xs font-medium tracking-wide mt-0.5">Manage and track players</p>
            </div>
          </div>

          {/* Action Buttons - Compact */}
          {isAuctioneer && (
            <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  const isLimitReached = user?.limits?.maxPlayers && user?.usage?.totalPlayers 
                    ? user.usage.totalPlayers >= user.limits.maxPlayers 
                    : false;
                  if (isLimitReached) {
                    alert(`⚠️ Player Limit Reached!\n\nYou have reached your maximum player limit of ${user?.limits?.maxPlayers}.\n\nCurrent: ${user?.usage?.totalPlayers} / ${user?.limits?.maxPlayers}\n\nPlease contact your administrator to increase your limit.`);
                    return;
                  }
                  setShowAddModal(true);
                }}
                className="group relative flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all duration-300 overflow-hidden flex-1 sm:flex-none"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
                  color: 'white',
                  border: '1.5px solid rgba(16, 185, 129, 0.5)',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3), 0 0 30px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px) scale(1.03)';
                  e.currentTarget.style.boxShadow = '0 6px 24px rgba(16, 185, 129, 0.5), 0 0 40px rgba(16, 185, 129, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.3), 0 0 30px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.15)';
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-700 ease-out" style={{ transform: 'translateX(-100%)' }}></div>
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span className="relative z-10 tracking-wide">Add Player</span>
              </button>
              <Link
                to="/form-builder"
                className="group relative flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all duration-300 overflow-hidden flex-1 sm:flex-none"
                style={{
                  background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #fbbf24 100%)',
                  color: '#1e293b',
                  border: '1.5px solid rgba(251, 191, 36, 0.6)',
                  boxShadow: '0 4px 16px rgba(251, 191, 36, 0.4), 0 0 30px rgba(251, 191, 36, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px) scale(1.03)';
                  e.currentTarget.style.boxShadow = '0 6px 24px rgba(251, 191, 36, 0.6), 0 0 40px rgba(251, 191, 36, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(251, 191, 36, 0.4), 0 0 30px rgba(251, 191, 36, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:translate-x-full transition-transform duration-700 ease-out" style={{ transform: 'translateX(-100%)' }}></div>
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="relative z-10 tracking-wide">Form Builder</span>
              </Link>
              <RegistrationLinkGenerator />
            </div>
          )}

          {/* Stats Card */}
          <div className="backdrop-blur-sm rounded-lg px-1.5 sm:px-2 py-1 hidden sm:block" style={{
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(10, 10, 10, 0.6) 50%, rgba(0, 0, 0, 0.7) 100%)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.4)'
          }}>
            <div>
              <p className="text-[8px] sm:text-[9px] text-gray-400 uppercase tracking-wider">Total</p>
              <p className="text-xs sm:text-sm font-black leading-none" style={{ color: '#D4AF37' }}>{players.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs - Ultra Compact */}
      <div className="flex-shrink-0 px-2 sm:px-4 py-1.5 sm:py-2 border-b" style={{
        background: 'rgba(0, 0, 0, 0.5)',
        borderBottom: '1px solid rgba(212, 175, 55, 0.2)'
      }}>
        <div className="flex gap-1 flex-wrap">
          {(['all', 'available', 'sold', 'unsold'] as const).map((f) => {
            const count = f === 'all' ? players.length : players.filter(p => p.status === f).length;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="group relative px-2 sm:px-3 py-1 sm:py-1.5 rounded-md font-bold text-[10px] sm:text-xs transition-all duration-300 capitalize"
                style={filter === f ? {
                  background: 'linear-gradient(135deg, #D4AF37 0%, #F0D770 50%, #D4AF37 100%)',
                  border: '1.5px solid rgba(212, 175, 55, 0.5)',
                  boxShadow: '0 2px 10px rgba(212, 175, 55, 0.3)',
                  color: '#000000',
                  transform: 'scale(1.03)'
                } : {
                  color: '#9ca3af',
                  background: 'transparent',
                  border: '1.5px solid transparent'
                }}
                onMouseEnter={(e) => {
                  if (filter !== f) {
                    e.currentTarget.style.background = 'rgba(212, 175, 55, 0.1)';
                    e.currentTarget.style.transform = 'scale(1.03)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (filter !== f) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                <span>{f}</span>
                <span className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-black" style={
                  filter === f 
                    ? { background: 'rgba(0, 0, 0, 0.2)' }
                    : { background: '#374151' }
                }>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Players Grid */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              <div className="inline-block animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4" style={{
                borderColor: 'transparent',
                borderTopColor: '#D4AF37'
              }}></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl sm:text-2xl">⚽</span>
              </div>
            </div>
            <p className="mt-3 sm:mt-4 text-gray-400 font-medium text-sm sm:text-base">Loading players...</p>
          </div>
        </div>
      ) : filteredPlayers.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-full flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(240, 215, 112, 0.2) 100%)',
              border: '2px solid rgba(212, 175, 55, 0.4)',
              boxShadow: '0 0 30px rgba(212, 175, 55, 0.3)'
            }}>
              <span className="text-3xl sm:text-5xl">🏐</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
              {filter === 'all' ? 'No Players Yet' : `No ${filter} Players`}
            </h3>
            <p className="text-gray-400 text-sm sm:text-base">
              {filter === 'all' 
                ? 'Share the registration link to add players to the auction.' 
                : `No players with status "${filter}" found.`}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filteredPlayers.map((player) => {
              const config = statusConfig[player.status as keyof typeof statusConfig];
              
              return (
                <div
                  key={player._id}
                  className="group relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 sm:p-4 shadow-lg border border-gray-700/50 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:scale-[1.02]"
                >
                  {/* Status Badge - Top Right */}
                  <div className={`absolute top-2 sm:top-3 right-2 sm:right-3 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-bold ${config.bg} ${config.border} ${config.text} border flex items-center gap-1`}>
                    <span>{config.icon}</span>
                    <span className="uppercase">{player.status}</span>
                  </div>

                  {/* Player Photo */}
                  <div className="flex justify-center mb-2 sm:mb-3">
                    {player.photoUrl && player.photoUrl.trim() !== '' ? (
                      <img 
                        src={player.photoUrl.startsWith('http') ? player.photoUrl : `${BACKEND_URL}${player.photoUrl}`} 
                        alt={player.name}
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-gray-700 group-hover:border-indigo-500 transition-all duration-300 group-hover:scale-110"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement!.innerHTML = `<div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-2xl sm:text-3xl font-black text-white border-4 border-gray-700 group-hover:border-indigo-500 transition-all duration-300 group-hover:scale-110">${player.name.charAt(0)}</div>`;
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-2xl sm:text-3xl font-black text-white border-4 border-gray-700 group-hover:border-indigo-500 transition-all duration-300 group-hover:scale-110">
                        {player.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Player Info */}
                  <div className="text-center mb-2 sm:mb-3">
                    <h3 className="text-base sm:text-lg font-black text-white truncate group-hover:text-indigo-400 transition-colors">
                      {player.name}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-gray-500 font-mono">{player.regNo}</p>
                  </div>

                  {/* Player Details */}
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex items-center justify-between bg-gray-900/50 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-700/30">
                      <span className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider">
                        Class
                      </span>
                      <span className="text-[10px] sm:text-xs font-bold text-white truncate ml-2">{player.class}</span>
                    </div>
                    
                    <div className="flex items-center justify-between bg-gray-900/50 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-700/30">
                      <span className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider">
                        Position
                      </span>
                      <span className="text-[10px] sm:text-xs font-bold text-white truncate ml-2">{player.position}</span>
                    </div>

                    {player.soldAmount && (
                      <div className="flex items-center justify-between bg-gradient-to-r from-green-600/10 to-emerald-600/10 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 border border-green-600/30">
                        <span className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider">
                          Sold
                        </span>
                        <span className="text-xs sm:text-sm font-black text-green-400">₹{player.soldAmount.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons - Only for Auctioneers */}
                  {isAuctioneer && (
                    <div className="mt-2 sm:mt-3 flex gap-1.5 sm:gap-2">
                      <button
                        onClick={() => setEditingPlayer(player)}
                        className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg font-semibold text-white text-xs sm:text-sm transition-all duration-300 hover:scale-105 shadow-lg flex items-center justify-center gap-1 sm:gap-2"
                      >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePlayer(player._id)}
                        className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-lg font-semibold text-white text-xs sm:text-sm transition-all duration-300 hover:scale-105 shadow-lg flex items-center justify-center gap-1 sm:gap-2"
                      >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Player Modal */}
      {editingPlayer && (
        <EditPlayerModal
          player={editingPlayer}
          onClose={() => setEditingPlayer(null)}
          onSuccess={() => {
            clearCache(); // Clear cache before fetching fresh data
            fetchPlayers();
            setEditingPlayer(null);
          }}
        />
      )}

      {/* Add Player Modal */}
      {showAddModal && (
        <EditPlayerModal
          player={null}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            clearCache(); // Clear cache before fetching fresh data
            fetchPlayers();
            setShowAddModal(false);
          }}
        />
      )}

      {/* Custom Scrollbar Styles + Header Animation */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #7c3aed);
        }

        /* Header Aurora Animation */
        @keyframes auroraHeader {
          0%, 100% {
            transform: translateX(0) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translateX(20px) scale(1.05);
            opacity: 0.5;
          }
        }

        .aurora-bg-header {
          position: absolute;
          width: 150%;
          height: 150%;
          top: -25%;
          left: -25%;
          background: radial-gradient(ellipse at 30% 50%, rgba(99, 102, 241, 0.2) 0%, transparent 50%),
                      radial-gradient(ellipse at 70% 50%, rgba(168, 85, 247, 0.2) 0%, transparent 50%);
          animation: auroraHeader 6s ease-in-out infinite;
          filter: blur(30px);
        }

        /* Header Floating Orbs */
        @keyframes floatHeader {
          0%, 100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(20px, -10px);
          }
        }

        .floating-orbs-header {
          position: absolute;
          width: 100%;
          height: 100%;
        }

        .orb-header {
          position: absolute;
          border-radius: 50%;
          filter: blur(15px);
          opacity: 0.4;
        }

        .orb-header-1 {
          width: 80px;
          height: 80px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.5), transparent);
          top: -20%;
          left: 20%;
          animation: floatHeader 5s ease-in-out infinite;
        }

        .orb-header-2 {
          width: 100px;
          height: 100px;
          background: radial-gradient(circle, rgba(168, 85, 247, 0.4), transparent);
          top: -30%;
          right: 30%;
          animation: floatHeader 6s ease-in-out infinite 1s;
        }

        .orb-header-3 {
          width: 70px;
          height: 70px;
          background: radial-gradient(circle, rgba(236, 72, 153, 0.5), transparent);
          bottom: -20%;
          left: 60%;
          animation: floatHeader 7s ease-in-out infinite 2s;
        }
      `}</style>
    </div>
  );
};

export default PlayersPage;
