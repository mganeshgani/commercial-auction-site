import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const navigation = [
    { name: 'Auction', href: '/' },
    { name: 'Teams', href: '/teams' },
    { name: 'Players', href: '/players' },
    { name: 'Unsold', href: '/unsold' },
    { name: 'Results', href: '/results' },
  ];

  // Add Admin link for admin users
  const { isAdmin } = useAuth();
  const allNavigation = isAdmin 
    ? [...navigation, { name: 'Admin', href: '/admin' }]
    : navigation;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
    navigate('/login');
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/20 text-red-400 border-red-500';
      case 'auctioneer':
        return 'bg-amber-500/20 text-amber-400 border-amber-500';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500';
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{
      background: 'linear-gradient(160deg, #000000 0%, #0a0a0a 25%, #1a1a1a 50%, #0f172a 75%, #1a1a1a 100%)',
      backgroundAttachment: 'fixed'
    }}>
      {/* Premium Header */}
      <header className="flex-shrink-0 relative z-50" style={{
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(26, 26, 26, 0.9) 50%, rgba(0, 0, 0, 0.95) 100%)',
        backdropFilter: 'blur(25px) saturate(1.5)',
        WebkitBackdropFilter: 'blur(25px) saturate(1.5)',
        borderBottom: '2px solid rgba(212, 175, 55, 0.3)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.8), 0 0 40px rgba(212, 175, 55, 0.1)'
      }}>
        <div className="max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex justify-between h-20">
            {/* Logo Section */}
            <div className="flex items-center -ml-2">
              <div className="flex-shrink-0 flex items-center gap-3">
                <div style={{
                  width: '64px',
                  height: '64px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img 
                    src="/logo.png" 
                    alt="College Logo" 
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain'
                    }}
                    onError={(e) => {
                      // Fallback to lightning emoji if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.fallback-icon')) {
                        const fallback = document.createElement('span');
                        fallback.className = 'fallback-icon';
                        fallback.textContent = '⚡';
                        fallback.style.fontSize = '24px';
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <h1 style={{
                    fontSize: '1.75rem',
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontWeight: 700,
                    background: 'linear-gradient(180deg, #FFFFFF 0%, #F5F5F0 30%, #FFD700 60%, #D4AF37 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    letterSpacing: '0.05em',
                    filter: 'drop-shadow(0 2px 10px rgba(212, 175, 55, 0.3))',
                    lineHeight: '1.2'
                  }}>
                    SPORTS AUCTION
                  </h1>
                  <p style={{
                    fontSize: '0.75rem',
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: 500,
                    color: '#D4AF37',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    opacity: 0.9
                  }}>
                    St Aloysius (Deemed To Be University)
                  </p>
                </div>
              </div>
              
              {/* Desktop Navigation */}
              <nav className="hidden lg:ml-10 lg:flex lg:space-x-2">
                {allNavigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="group relative"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px 16px',
                        fontSize: '0.8125rem',
                        fontFamily: "'Montserrat', sans-serif",
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: isActive ? '#FFD700' : '#FFFFFF',
                        background: isActive 
                          ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(255, 215, 0, 0.1) 100%)'
                          : 'transparent',
                        backdropFilter: isActive ? 'blur(10px)' : 'none',
                        border: isActive 
                          ? '1px solid rgba(212, 175, 55, 0.4)'
                          : '1px solid transparent',
                        borderRadius: '10px',
                        transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                        textShadow: isActive ? '0 0 10px rgba(255, 215, 0, 0.5)' : 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(255, 215, 0, 0.05) 100%)';
                          e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.2)';
                          e.currentTarget.style.color = '#FFD700';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.borderColor = 'transparent';
                          e.currentTarget.style.color = '#FFFFFF';
                        }
                      }}
                    >
                      {item.name}
                      {isActive && (
                        <div style={{
                          position: 'absolute',
                          bottom: '-2px',
                          left: '20px',
                          right: '20px',
                          height: '2px',
                          background: 'linear-gradient(90deg, transparent 0%, #FFD700 50%, transparent 100%)',
                          boxShadow: '0 0 10px rgba(255, 215, 0, 0.8)'
                        }} />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right Side - User Info & Status */}
            <div className="flex items-center gap-3 relative z-[100]">
              {/* User Menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all hover:bg-gray-800/50"
                  style={{
                    border: '1px solid rgba(212, 175, 55, 0.3)'
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-white max-w-[100px] truncate">{user?.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getRoleBadgeColor(user?.role || 'viewer')}`}>
                      {user?.role}
                    </span>
                  </div>
                  <svg
                    className={`w-3 h-3 text-amber-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div
                    className="absolute right-0 mt-2 w-52 rounded-lg shadow-2xl z-[9999]"
                    style={{
                      background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.98) 0%, rgba(26, 26, 26, 0.95) 100%)',
                      border: '1px solid rgba(212, 175, 55, 0.4)',
                      backdropFilter: 'blur(20px)'
                    }}
                  >
                    <div className="p-3 border-b border-gray-700">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Signed in as</p>
                      <p className="text-white text-xs font-medium truncate">{user?.email}</p>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-900/20 rounded transition-colors flex items-center gap-2 font-medium"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Live Status */}
              <div className="relative" style={{
                padding: '6px 12px',
                background: 'linear-gradient(135deg, rgba(176, 139, 79, 0.08) 0%, rgba(125, 75, 87, 0.05) 100%)',
                border: '1.5px solid rgba(176, 139, 79, 0.3)',
                borderRadius: '20px',
                fontSize: '0.625rem',
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#B08B4F',
                animation: 'liveBorderGlow 3s ease-in-out infinite',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Animated Border Glow */}
                <span style={{
                  position: 'absolute',
                  inset: '-2px',
                  background: 'linear-gradient(135deg, #B08B4F 0%, #C99D5F 50%, #B08B4F 100%)',
                  backgroundSize: '200% 200%',
                  borderRadius: '20px',
                  filter: 'blur(6px)',
                  opacity: 0.15,
                  animation: 'liveGlowShift 3s ease-in-out infinite',
                  zIndex: -1
                }}></span>
                
                {/* Text with gradient animation */}
                <span style={{
                  background: 'linear-gradient(135deg, #B08B4F 0%, #C99D5F 50%, #B08B4F 100%)',
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'liveTextShimmer 3s ease-in-out infinite',
                  fontWeight: 700,
                  filter: 'drop-shadow(0 2px 4px rgba(176, 139, 79, 0.3))'
                }}>
                  ● LIVE
                </span>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes liveBorderGlow {
            0%, 100% {
              border-color: rgba(176, 139, 79, 0.25);
              filter: drop-shadow(0 2px 8px rgba(176, 139, 79, 0.15));
            }
            50% {
              border-color: rgba(176, 139, 79, 0.45);
              filter: drop-shadow(0 4px 12px rgba(176, 139, 79, 0.25)) drop-shadow(0 0 20px rgba(176, 139, 79, 0.15));
            }
          }
          
          @keyframes liveGlowShift {
            0%, 100% {
              background-position: 0% 50%;
              opacity: 0.12;
            }
            50% {
              background-position: 100% 50%;
              opacity: 0.2;
            }
          }
          
          @keyframes liveTextShimmer {
            0%, 100% {
              background-position: 0% 50%;
              filter: drop-shadow(0 2px 4px rgba(176, 139, 79, 0.3));
            }
            50% {
              background-position: 100% 50%;
              filter: drop-shadow(0 2px 6px rgba(176, 139, 79, 0.4));
            }
          }
        `}</style>

        {/* Mobile Navigation - Below header */}
        <div className="lg:hidden border-t" style={{
          borderColor: 'rgba(212, 175, 55, 0.2)',
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(10px)'
        }}>
          <nav className="flex overflow-x-auto px-4 py-2 gap-2">
            {allNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px 14px',
                    fontSize: '0.75rem',
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: isActive ? '#FFD700' : '#FFFFFF',
                    background: isActive 
                      ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(255, 215, 0, 0.1) 100%)'
                      : 'transparent',
                    border: isActive 
                      ? '1px solid rgba(212, 175, 55, 0.4)'
                      : '1px solid transparent',
                    borderRadius: '8px',
                    whiteSpace: 'nowrap',
                    transition: 'all 300ms'
                  }}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
};

export default Layout;