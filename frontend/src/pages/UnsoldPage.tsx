import React, { useState, useEffect, useCallback } from 'react';
import { Player, Team } from '../types';
import confetti from 'canvas-confetti';
import { useAuth } from '../contexts/AuthContext';
import { playerService, teamService, clearCache } from '../services/api';
import { initializeSocket } from '../services/socket';
import UnsoldPlayerCard from '../components/unsold/UnsoldPlayerCard';

const UnsoldPage: React.FC = () => {
  const { isAuctioneer } = useAuth();
  const [unsoldPlayers, setUnsoldPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [soldAmount, setSoldAmount] = useState<number>(0);
  const [selectedTeam, setSelectedTeam] = useState<string>('');

  const BACKEND_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5001';

  const fetchUnsoldPlayers = useCallback(async (bypassCache = false) => {
    try {
      const data = await playerService.getUnsoldPlayers(!bypassCache); // Use cache unless bypassing
      setUnsoldPlayers(data);
    } catch (error) {
      console.error('Error fetching unsold players:', error);
    }
  }, []);

  const fetchTeams = useCallback(async (bypassCache = false) => {
    try {
      const data = await teamService.getAllTeams(!bypassCache); // Use cache unless bypassing
      setTeams(data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchUnsoldPlayers(), fetchTeams()]);
      setLoading(false);
    };
    loadData();

    // Setup Socket.io for real-time updates
    const socket = initializeSocket();

    socket.on('connect', () => {
      console.log('✓ Unsold page connected to socket');
    });

    // Debounced fetch for socket events (background updates without loading state)
    let fetchTimeout: NodeJS.Timeout | null = null;
    const debouncedFetch = () => {
      if (fetchTimeout) clearTimeout(fetchTimeout);
      fetchTimeout = setTimeout(() => {
        console.log('🔄 Unsold page: Background update triggered');
        clearCache();
        fetchUnsoldPlayers(true); // Bypass cache
        fetchTeams(true);
      }, 300);
    };

    // Listen to relevant events
    socket.on('playerAdded', debouncedFetch);
    socket.on('playerDeleted', debouncedFetch);
    socket.on('playerSold', debouncedFetch);
    socket.on('playerMarkedUnsold', debouncedFetch);
    socket.on('playerUpdated', debouncedFetch);
    socket.on('dataReset', () => {
      console.log('Data reset - clearing cache');
      clearCache();
      fetchUnsoldPlayers(true);
      fetchTeams(true);
    });

    socket.on('disconnect', () => {
      console.log('✗ Unsold page disconnected');
    });

    return () => {
      if (fetchTimeout) clearTimeout(fetchTimeout);
      socket.off('connect');
      socket.off('playerAdded');
      socket.off('playerDeleted');
      socket.off('playerSold');
      socket.off('playerMarkedUnsold');
      socket.off('playerUpdated');
      socket.off('dataReset');
      socket.off('disconnect');
    };
  }, [fetchUnsoldPlayers, fetchTeams]);

  const handleAuctionClick = useCallback((player: Player) => {
    setSelectedPlayer(player);
    setSoldAmount(0);
    setSelectedTeam('');
    setShowModal(true);
  }, []);

  const handleAuctionConfirm = useCallback(async () => {
    if (!selectedPlayer || !selectedTeam || !soldAmount) {
      return;
    }

    // OPTIMIZED: Play confetti immediately (before API calls)
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // OPTIMIZED: Update UI immediately (optimistic update)
    setTeams(prevTeams => 
      prevTeams.map(team => 
        team._id === selectedTeam 
          ? { 
              ...team, 
              filledSlots: team.filledSlots + 1,
              remainingBudget: (team.remainingBudget ?? team.budget ?? 0) - soldAmount,
              players: [...(team.players || []), selectedPlayer]
            }
          : team
      )
    );

    // Remove player from unsold list immediately
    setUnsoldPlayers(prev => prev.filter(p => p._id !== selectedPlayer._id));

    // Close modal immediately
    setShowModal(false);
    setSelectedPlayer(null);
    setSoldAmount(0);
    setSelectedTeam('');

    try {
      // Update player with sold status, team, and amount
      await playerService.updatePlayer(selectedPlayer._id, {
        status: 'sold',
        team: selectedTeam,
        soldAmount: soldAmount
      });

      // Clear cache and refresh in background (non-blocking)
      clearCache();
      fetchUnsoldPlayers();
      fetchTeams();
    } catch (error) {
      console.error('Error auctioning player:', error);
      // Revert optimistic update on error
      clearCache();
      await Promise.all([fetchUnsoldPlayers(), fetchTeams()]);
    }
  }, [selectedPlayer, selectedTeam, soldAmount, fetchUnsoldPlayers, fetchTeams]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Ultra-Compact Premium Header */}
      <div className="flex-shrink-0 border-b px-2 sm:px-4 py-1.5 sm:py-2" style={{
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(13, 17, 23, 0.9) 50%, rgba(0, 0, 0, 0.95) 100%)',
        borderBottom: '1.5px solid rgba(212, 175, 55, 0.3)',
        boxShadow: '0 2px 20px rgba(0, 0, 0, 0.6), 0 0 30px rgba(212, 175, 55, 0.08)'
      }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight leading-none" style={{
              background: 'linear-gradient(135deg, #FFFFFF 0%, #fca5a5 50%, #dc2626 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 0 30px rgba(220, 38, 38, 0.3)'
            }}>Unsold Players</h1>
            <p className="text-gray-400 text-[10px] sm:text-xs font-medium tracking-wide mt-0.5">Players not sold in auction</p>
          </div>
          <div className="backdrop-blur-sm rounded-lg px-1.5 sm:px-2 py-1" style={{
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(10, 10, 10, 0.6) 50%, rgba(0, 0, 0, 0.7) 100%)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.4)'
          }}>
            <div>
              <p className="text-[8px] sm:text-[9px] text-gray-400 uppercase tracking-wider">Total Unsold</p>
              <p className="text-xs sm:text-sm font-black text-red-400 leading-none">{unsoldPlayers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Players Grid */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              <div className="inline-block animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4" style={{
                borderColor: 'transparent',
                borderTopColor: '#dc2626'
              }}></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl sm:text-2xl">🚫</span>
              </div>
            </div>
            <p className="mt-3 sm:mt-4 text-gray-400 font-medium text-sm sm:text-base">Loading unsold players...</p>
          </div>
        </div>
      ) : unsoldPlayers.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center border border-green-500/30">
              <span className="text-3xl sm:text-5xl">🎉</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">All Players Sold!</h3>
            <p className="text-gray-400 text-sm sm:text-base">Great job! No unsold players remaining.</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {unsoldPlayers.map((player) => (
              <UnsoldPlayerCard
                key={player._id}
                player={player}
                isAuctioneer={isAuctioneer}
                onAuction={handleAuctionClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* Auction Modal */}
      {showModal && selectedPlayer && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl sm:rounded-2xl border border-gray-700 max-w-md w-full shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-600/20 to-green-600/20 border-b border-gray-700 px-4 sm:px-6 py-3 sm:py-4 rounded-t-xl sm:rounded-t-2xl">
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 sm:gap-3">
                <span>🔨</span>
                Auction Player
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">Enter details to auction {selectedPlayer.name}</p>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              {/* Player Info */}
              <div className="bg-gray-900/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-700/50">
                <div className="flex items-center gap-3 sm:gap-4">
                  {selectedPlayer.photoUrl && selectedPlayer.photoUrl.trim() !== '' ? (
                    <img 
                      src={selectedPlayer.photoUrl.startsWith('http') ? selectedPlayer.photoUrl : `${BACKEND_URL}${selectedPlayer.photoUrl}`} 
                      alt={selectedPlayer.name}
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-emerald-500"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = `<div class="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center text-xl sm:text-2xl font-black text-white">${selectedPlayer.name.charAt(0)}</div>`;
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center text-xl sm:text-2xl font-black text-white">
                      {selectedPlayer.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white">{selectedPlayer.name}</h3>
                    <p className="text-[10px] sm:text-xs text-gray-400">{selectedPlayer.regNo} • {selectedPlayer.class}</p>
                    <p className="text-[10px] sm:text-xs text-emerald-400 font-bold">{selectedPlayer.position}</p>
                  </div>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  Sold Amount (₹)
                </label>
                <input
                  type="number"
                  value={soldAmount || ''}
                  onChange={(e) => setSoldAmount(Number(e.target.value))}
                  placeholder="Enter amount..."
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-900/50 border-2 border-gray-700 rounded-lg sm:rounded-xl text-white font-bold text-base sm:text-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  autoFocus
                />
              </div>

              {/* Team Selection */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-300 mb-1.5 sm:mb-2">
                  Select Team
                </label>
                <div className="space-y-1.5 sm:space-y-2 max-h-36 sm:max-h-48 overflow-y-auto custom-scrollbar">
                  {teams.map((team) => (
                    <button
                      key={team._id}
                      onClick={() => setSelectedTeam(team._id)}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl border-2 transition-all text-left ${
                        selectedTeam === team._id
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'bg-gray-900/50 border-gray-700 text-gray-300 hover:border-emerald-500/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-xs sm:text-sm">{team.name}</p>
                          <p className="text-[10px] sm:text-xs opacity-80">
                            Budget: ₹{team.remainingBudget?.toLocaleString() || 0} • Players: {team.players.length}/{team.totalSlots || 15}
                          </p>
                        </div>
                        {selectedTeam === team._id && (
                          <span className="text-lg sm:text-xl">✓</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-900/50 rounded-b-xl sm:rounded-b-2xl border-t border-gray-700 flex gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedPlayer(null);
                  setSoldAmount(0);
                  setSelectedTeam('');
                }}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gray-700 hover:bg-gray-600 rounded-lg sm:rounded-xl font-bold text-white text-sm sm:text-base transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAuctionConfirm}
                disabled={!soldAmount || !selectedTeam}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 rounded-lg sm:rounded-xl font-bold text-white text-sm sm:text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 sm:gap-2"
              >
                <span>✓</span>
                Confirm Auction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #ef4444, #f97316);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #dc2626, #ea580c);
        }
      `}</style>
    </div>
  );
};

export default UnsoldPage;
