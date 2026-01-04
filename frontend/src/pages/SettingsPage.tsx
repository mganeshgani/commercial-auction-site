import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface AppConfig {
  branding: {
    title: string;
    subtitle: string;
    logoUrl: string;
  };
}

const SettingsPage: React.FC = () => {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
  const [, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    subtitle: ''
  });

  const fetchConfig = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConfig(response.data.data);
      setFormData({
        title: response.data.data.branding.title,
        subtitle: response.data.data.branding.subtitle
      });
      setLogoPreview(response.data.data.branding.logoUrl);
    } catch (error) {
      console.error('Error fetching config:', error);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('subtitle', formData.subtitle);
      if (logoFile) {
        submitData.append('logo', logoFile);
      }

      await axios.put(`${API_URL}/config`, submitData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Settings saved successfully! Please refresh the page to see changes.');
      fetchConfig();
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset to default settings?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Settings reset successfully! Please refresh the page.');
      fetchConfig();
    } catch (error) {
      console.error('Error resetting config:', error);
      alert('Error resetting settings');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-3 sm:p-4">
      <div className="max-w-2xl mx-auto">
        {/* Premium Header with Gradient */}
        <div className="mb-4 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-transparent blur-3xl"></div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1 h-8 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full"></div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 text-transparent bg-clip-text">
                Branding Settings
              </h1>
            </div>
            <p className="text-xs text-slate-400 ml-3">Customize your auction platform's appearance</p>
          </div>
        </div>

        {/* Ultra Premium Form Card */}
        <form onSubmit={handleSubmit} className="relative overflow-hidden rounded-2xl" style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
          border: '1px solid rgba(212, 175, 55, 0.2)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(212, 175, 55, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
        }}>
          {/* Shimmer Effect Overlay */}
          <div className="absolute inset-0 opacity-30 pointer-events-none" style={{
            background: 'radial-gradient(circle at 50% 0%, rgba(212, 175, 55, 0.08) 0%, transparent 50%)'
          }}></div>

          <div className="relative p-4 sm:p-5 space-y-4">
            {/* Logo Upload Section */}
            <div className="relative p-4 rounded-xl" style={{
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, rgba(212, 175, 55, 0.02) 100%)',
              border: '1px solid rgba(212, 175, 55, 0.15)'
            }}>
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <label className="text-xs font-bold text-amber-300">Application Logo</label>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl opacity-20 group-hover:opacity-30 transition-opacity blur"></div>
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex items-center justify-center" style={{
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
                    border: '2px solid rgba(212, 175, 55, 0.3)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  }}>
                    {logoPreview ? (
                      <img 
                        src={logoPreview} 
                        alt="Logo preview" 
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <svg className="w-8 h-8 sm:w-10 sm:h-10 text-amber-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setLogoFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setLogoPreview(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs rounded-lg text-white transition-all file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:transition-all file:cursor-pointer"
                    style={{
                      background: 'rgba(30, 41, 59, 0.6)',
                      border: '1px solid rgba(212, 175, 55, 0.2)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.2)';
                    }}
                  />
                  <style>{`
                    input[type="file"]::file-selector-button {
                      background: linear-gradient(135deg, #d4af37 0%, #f0d770 50%, #d4af37 100%);
                      color: #1a1a1a;
                      box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
                    }
                    input[type="file"]::file-selector-button:hover {
                      background: linear-gradient(135deg, #f0d770 0%, #d4af37 50%, #f0d770 100%);
                      box-shadow: 0 6px 16px rgba(212, 175, 55, 0.4);
                    }
                  `}</style>
                  <p className="text-[9px] text-slate-500 mt-1.5 ml-0.5">Square image, max 5MB • PNG, JPG, or SVG</p>
                </div>
              </div>
            </div>

            {/* Input Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Main Title */}
              <div className="relative p-3 rounded-xl" style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.03) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.15)'
              }}>
                <label htmlFor="title" className="flex items-center gap-1.5 text-xs font-bold text-indigo-300 mb-2">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  Main Title
                </label>
                <input
                  id="title"
                  type="text"
                  required
                  maxLength={50}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg text-white placeholder-slate-500 transition-all focus:outline-none"
                  placeholder="e.g., SPORTS AUCTION"
                  style={{
                    background: 'rgba(30, 41, 59, 0.6)',
                    border: '1px solid rgba(99, 102, 241, 0.2)'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.2)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <p className="text-[9px] text-slate-500 mt-1 flex items-center justify-between">
                  <span>Required field</span>
                  <span className={formData.title.length > 40 ? 'text-amber-500' : ''}>{formData.title.length}/50</span>
                </p>
              </div>

              {/* Subtitle */}
              <div className="relative p-3 rounded-xl" style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(167, 139, 250, 0.03) 100%)',
                border: '1px solid rgba(139, 92, 246, 0.15)'
              }}>
                <label htmlFor="subtitle" className="flex items-center gap-1.5 text-xs font-bold text-purple-300 mb-2">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Organization
                </label>
                <input
                  id="subtitle"
                  type="text"
                  required
                  maxLength={100}
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg text-white placeholder-slate-500 transition-all focus:outline-none"
                  placeholder="e.g., Your Organization Name"
                  style={{
                    background: 'rgba(30, 41, 59, 0.6)',
                    border: '1px solid rgba(139, 92, 246, 0.2)'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <p className="text-[9px] text-slate-500 mt-1 flex items-center justify-between">
                  <span>Required field</span>
                  <span className={formData.subtitle.length > 80 ? 'text-amber-500' : ''}>{formData.subtitle.length}/100</span>
                </p>
              </div>
            </div>

            {/* Live Preview */}
            <div className="relative p-4 rounded-xl overflow-hidden" style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)',
              border: '1px solid rgba(212, 175, 55, 0.2)',
              boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.3)'
            }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <p className="text-xs font-bold text-emerald-300">Live Preview</p>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Real-time</span>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{
                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(26, 26, 26, 0.3) 100%)',
                border: '1px solid rgba(212, 175, 55, 0.15)'
              }}>
                {logoPreview && (
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden flex-shrink-0 ring-2 ring-amber-500/30">
                    <img src={logoPreview} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                )}
                <div>
                  <h2 className="text-base sm:text-lg font-bold bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 text-transparent bg-clip-text">
                    {formData.title || 'SPORTS AUCTION'}
                  </h2>
                  <p className="text-[10px] sm:text-xs text-amber-500/70 mt-0.5">
                    {formData.subtitle || 'Your Organization Name'}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleReset}
                disabled={saving}
                className="group px-4 py-2.5 text-xs font-bold rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(220, 38, 38, 0.15) 100%)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 group px-4 py-2.5 text-xs font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #d4af37 0%, #f0d770 50%, #d4af37 100%)',
                  color: '#1a1a1a',
                  boxShadow: '0 8px 24px rgba(212, 175, 55, 0.4), 0 0 20px rgba(212, 175, 55, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(212, 175, 55, 0.5), 0 0 30px rgba(212, 175, 55, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(212, 175, 55, 0.4), 0 0 20px rgba(212, 175, 55, 0.2)';
                }}
              >
                {saving ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
