import React from 'react';
import { Team } from '../../types';

interface TeamCardProps {
  team: Team;
  index: number;
  playerCount: number;
  actualFilledSlots: number;
  actualRemaining: number;
  actualSpent: number;
  budgetUsedPercentage: string;
  teamPlayers: any[];
  onClick: () => void;
  getPositionColor: (position: string) => string;
  getPositionIcon: (position: string) => string;
}

const TeamCard = React.memo<TeamCardProps>(({
  team,
  index,
  actualFilledSlots,
  actualRemaining,
  actualSpent,
  budgetUsedPercentage,
  teamPlayers,
  onClick,
  getPositionColor,
  getPositionIcon
}) => {
  // Premium gradient colors for teams
  const teamGradients = [
    'from-violet-600/20 via-purple-600/20 to-fuchsia-600/20',
    'from-blue-600/20 via-cyan-600/20 to-teal-600/20',
    'from-emerald-600/20 via-green-600/20 to-lime-600/20',
    'from-amber-600/20 via-yellow-600/20 to-orange-600/20',
    'from-rose-600/20 via-pink-600/20 to-red-600/20',
    'from-indigo-600/20 via-blue-600/20 to-sky-600/20',
  ];
  const teamBorderColors = [
    'border-violet-500/40 hover:border-violet-400/60',
    'border-blue-500/40 hover:border-blue-400/60',
    'border-emerald-500/40 hover:border-emerald-400/60',
    'border-amber-500/40 hover:border-amber-400/60',
    'border-rose-500/40 hover:border-rose-400/60',
    'border-indigo-500/40 hover:border-indigo-400/60',
  ];
  const gradientClass = teamGradients[index % teamGradients.length];
  const borderClass = teamBorderColors[index % teamBorderColors.length];

  return (
    <div
      onClick={onClick}
      className={`group w-full relative overflow-hidden bg-gradient-to-br ${gradientClass} backdrop-blur-sm rounded-xl border ${borderClass} transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-white/10 cursor-pointer`}
      style={{ maxHeight: 'calc(100vh - 180px)' }}
    >
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* Card Content - Ultra Compact */}
      <div className="relative z-10 p-3 flex flex-col h-full">
        {/* Compact Team Header */}
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight" style={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #F0D770 50%, #D4AF37 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>{team.name}</h2>
              <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-lg">
                {index + 1}
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] mt-1">
              <span className="bg-slate-800/60 px-1.5 py-0.5 rounded text-slate-300 font-semibold">
                {actualFilledSlots}/{team.totalSlots}
              </span>
              <span className="bg-slate-800/60 px-1.5 py-0.5 rounded text-slate-300 font-semibold">
                {budgetUsedPercentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Compact Budget Info */}
        <div className="grid grid-cols-2 gap-1.5 mb-2">
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-lg p-1.5">
            <p className="text-[10px] text-slate-400">Spent</p>
            <p className="text-sm font-black bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">
              ₹{(actualSpent / 1000).toFixed(1)}K
            </p>
          </div>
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-lg p-1.5">
            <p className="text-[10px] text-slate-400">Left</p>
            <p className={`text-sm font-black ${
              actualRemaining >= (team.budget || 0) * 0.3 ? 'text-emerald-400' : 
              actualRemaining >= (team.budget || 0) * 0.1 ? 'text-amber-400' : 
              'text-rose-400'
            }`}>
              ₹{(actualRemaining / 1000).toFixed(1)}K
            </p>
          </div>
        </div>

        {/* Compact Progress Bar */}
        <div className="mb-2">
          <div className="h-1.5 bg-slate-800/60 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${
                parseFloat(budgetUsedPercentage) >= 90 ? 'bg-gradient-to-r from-rose-500 to-red-600' :
                parseFloat(budgetUsedPercentage) >= 70 ? 'bg-gradient-to-r from-amber-500 to-orange-600' :
                'bg-gradient-to-r from-emerald-500 to-teal-600'
              }`}
              style={{ width: `${budgetUsedPercentage}%` }}
            ></div>
          </div>
        </div>
        
        {/* Players List - Scrollable Compact (Max 4 visible) */}
        {teamPlayers.length > 0 ? (
          <div className="flex-1 min-h-0">
            <div className="overflow-y-auto custom-scrollbar space-y-1.5" style={{ maxHeight: '240px' }}>
            {teamPlayers.map((player) => (
              <div
                key={player._id}
                className={`group/player relative overflow-hidden bg-gradient-to-br ${getPositionColor(player.position)} backdrop-blur-sm rounded-lg p-2 border ${
                  player.position === 'Spiker' ? 'border-amber-500/40' : 
                  player.position === 'Setter' ? 'border-purple-500/40' : 
                  player.position === 'Libero' ? 'border-blue-500/40' :
                  player.position === 'Blocker' ? 'border-red-500/40' : 
                  'border-emerald-500/40'
                } hover:scale-102 transition-all duration-300`}
              >
                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/player:translate-x-full transition-transform duration-1000"></div>
                
                <div className="relative z-10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="text-lg">{getPositionIcon(player.position)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-xs truncate">{player.name}</p>
                      <p className="text-[10px] text-slate-300">{player.position} • {player.class}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 bg-slate-900/60 backdrop-blur-sm rounded px-1.5 py-0.5">
                    <p className="text-[10px] font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                      ₹{(player.soldAmount! / 1000).toFixed(0)}K
                    </p>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-slate-900/30 rounded-lg border border-slate-700/30">
            <div className="text-center py-4">
              <p className="text-slate-400 text-xs font-semibold">No Players</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

TeamCard.displayName = 'TeamCard';

export default TeamCard;
