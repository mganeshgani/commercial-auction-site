import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface BrandingConfig {
  title: string;
  subtitle: string;
  logoUrl: string;
}

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
  
  const [branding, setBranding] = useState<BrandingConfig>({
    title: 'SPORTS AUCTION',
    subtitle: 'St Aloysius (Deemed To Be University)',
    logoUrl: '/logo.png'
  });

  // Fetch branding config
  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await axios.get(`${API_URL}/config`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.data?.data?.branding) {
            const b = response.data.data.branding;
            setBranding({
              title: b.title || 'SPORTS AUCTION',
              subtitle: b.subtitle || 'St Aloysius (Deemed To Be University)',
              logoUrl: b.logoUrl || '/logo.png'
            });
          }
        }
      } catch (error) {
        console.error('Error fetching branding config:', error);
      }
    };
    fetchBranding();
  }, [API_URL]);
  
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
        return 'bg-gradient-to-r from-red-500/30 to-red-600/30 text-red-300 border-red-400/60';
      case 'auctioneer':
        return 'bg-gradient-to-r from-amber-500/30 to-yellow-500/30 text-amber-300 border-amber-400/60';
      default:
        return 'bg-gradient-to-r from-slate-500/30 to-slate-600/30 text-slate-300 border-slate-400/60';
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
                    src={branding.logoUrl || '/logo.png'} 
                    alt="Logo" 
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
                    {branding.title}
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
                    {branding.subtitle}
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
              {/* Ultra-Premium User Menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="group relative flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full transition-all duration-500 overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(26, 26, 26, 0.9) 50%, rgba(0, 0, 0, 0.8) 100%)',
                    border: '1.5px solid rgba(212, 175, 55, 0.5)',
                    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.6), 0 0 30px rgba(212, 175, 55, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.8)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.7), 0 0 40px rgba(212, 175, 55, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.12)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.5)';
                    e.currentTarget.style.boxShadow = '0 4px 24px rgba(0, 0, 0, 0.6), 0 0 30px rgba(212, 175, 55, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all duration-1000 ease-out" style={{ transform: 'translateX(-100%)' }}></div>
                  
                  {/* User Avatar with Glow Ring */}
                  <div className="relative" style={{
                    padding: '2px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #D4AF37 0%, #F0D770 50%, #D4AF37 100%)'
                  }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.5)'
                    }}>
                      <span style={{
                        fontSize: '15px',
                        fontWeight: 800,
                        background: 'linear-gradient(135deg, #F0D770 0%, #D4AF37 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        filter: 'drop-shadow(0 1px 2px rgba(212, 175, 55, 0.5))'
                      }}>
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    {/* Online Indicator */}
                    <div style={{
                      position: 'absolute',
                      bottom: '0',
                      right: '0',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                      border: '2px solid #0a0a0a',
                      boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)'
                    }}></div>
                  </div>
                  
                  {/* User Name Only */}
                  <span className="relative z-10 text-sm font-semibold max-w-[100px] truncate" style={{
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #E5E5E5 50%, #D4AF37 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    letterSpacing: '0.02em'
                  }}>{user?.name}</span>
                  
                  {/* Dropdown Arrow */}
                  <svg
                    className="relative z-10 transition-transform duration-300 ml-1"
                    style={{
                      width: '12px',
                      height: '12px',
                      color: '#D4AF37',
                      transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                      filter: 'drop-shadow(0 1px 2px rgba(212, 175, 55, 0.4))'
                    }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div
                    className="absolute right-0 mt-3 w-56 rounded-2xl shadow-2xl z-[9999] overflow-hidden"
                    style={{
                      background: 'linear-gradient(145deg, rgba(10, 10, 10, 0.98) 0%, rgba(26, 26, 26, 0.98) 100%)',
                      border: '1.5px solid rgba(212, 175, 55, 0.4)',
                      backdropFilter: 'blur(20px)',
                      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(212, 175, 55, 0.1)'
                    }}
                  >
                    {/* User Info Header */}
                    <div className="p-4" style={{
                      background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%)',
                      borderBottom: '1px solid rgba(212, 175, 55, 0.2)'
                    }}>
                      <div className="flex items-center gap-3">
                        <div style={{
                          padding: '2px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #D4AF37 0%, #F0D770 100%)'
                        }}>
                          <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <span style={{
                              fontSize: '18px',
                              fontWeight: 800,
                              background: 'linear-gradient(135deg, #F0D770 0%, #D4AF37 100%)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              backgroundClip: 'text'
                            }}>
                              {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                          <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Menu Items */}
                    <div className="p-2">
                      {user?.role === 'auctioneer' && (
                        <Link
                          to="/settings"
                          onClick={() => setShowUserMenu(false)}
                          className="group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300"
                          style={{ background: 'transparent' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.08) 100%)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">Settings</p>
                            <p className="text-[10px] text-slate-500">Branding & preferences</p>
                          </div>
                        </Link>
                      )}
                      
                      <button
                        onClick={handleLogout}
                        className="w-full group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 mt-1"
                        style={{ background: 'transparent' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.08) 100%)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white text-left">Sign Out</p>
                          <p className="text-[10px] text-slate-500 text-left">End your session</p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

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