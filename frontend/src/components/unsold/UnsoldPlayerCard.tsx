import React from 'react';
import { Player } from '../../types';

const BACKEND_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5001';

interface UnsoldPlayerCardProps {
  player: Player;
  isAuctioneer: boolean;
  onAuction: (player: Player) => void;
}

const UnsoldPlayerCard = React.memo<UnsoldPlayerCardProps>(({ player, isAuctioneer, onAuction }) => {
  return (
    <div
      className="group relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-3 sm:p-4 shadow-lg border border-gray-700/50 hover:border-red-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/10 hover:scale-[1.02]"
    >
      {/* Unsold Badge - Top Right */}
      <div className="absolute top-2 sm:top-3 right-2 sm:right-3 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-bold bg-red-500/20 border-red-500/30 text-red-400 border flex items-center gap-1">
        <span>🚫</span>
        <span className="uppercase">Unsold</span>
      </div>

      {/* Player Photo */}
      <div className="flex justify-center mb-2 sm:mb-3">
        {player.photoUrl && player.photoUrl.trim() !== '' ? (
          <img 
            src={player.photoUrl.startsWith('http') ? player.photoUrl : `${BACKEND_URL}${player.photoUrl}`} 
            alt={player.name}
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-gray-700 group-hover:border-red-500 transition-all duration-300 group-hover:scale-110"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.parentElement!.innerHTML = `<div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-2xl sm:text-3xl font-black text-white border-4 border-gray-700 group-hover:border-red-500 transition-all duration-300 group-hover:scale-110">${player.name.charAt(0)}</div>`;
            }}
          />
        ) : (
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-2xl sm:text-3xl font-black text-white border-4 border-gray-700 group-hover:border-red-500 transition-all duration-300 group-hover:scale-110">
            {player.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Player Info */}
      <div className="text-center mb-2 sm:mb-3">
        <h3 className="text-base sm:text-lg font-black text-white truncate group-hover:text-red-400 transition-colors">
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

        {/* Auction Button - Only for Auctioneers */}
        {isAuctioneer ? (
        <button
          onClick={() => onAuction(player)}
          className="w-full mt-1.5 sm:mt-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 rounded-lg text-xs sm:text-sm font-bold transition-all duration-300 hover:scale-105 shadow-lg flex items-center justify-center gap-1.5 sm:gap-2"
        >
          <span>Auction Now</span>
        </button>
        ) : (
          <div className="w-full mt-1.5 sm:mt-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-center" style={{
            background: 'rgba(100, 100, 100, 0.2)',
            border: '1px solid rgba(150, 150, 150, 0.3)'
          }}>
            <p className="text-gray-400 text-[10px] sm:text-xs">🔒 Viewer Mode</p>
          </div>
        )}
      </div>
    </div>
  );
});

UnsoldPlayerCard.displayName = 'UnsoldPlayerCard';

export default UnsoldPlayerCard;
