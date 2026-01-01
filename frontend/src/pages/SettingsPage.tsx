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
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Branding Settings</h1>
          <p className="text-slate-400">Customize your auction platform's appearance</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-slate-900 rounded-xl border border-slate-700 p-6 space-y-6">
          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">
              Application Logo
            </label>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-xl overflow-hidden flex items-center justify-center bg-slate-800 border-2 border-slate-700">
                {logoPreview ? (
                  <img 
                    src={logoPreview} 
                    alt="Logo preview" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <svg className="w-12 h-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
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
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-amber-500 file:text-white hover:file:bg-amber-600 file:cursor-pointer"
                />
                <p className="text-xs text-slate-500 mt-2">Recommended: Square image, max 5MB</p>
              </div>
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-slate-300 mb-2">
              Main Title
            </label>
            <input
              id="title"
              type="text"
              required
              maxLength={50}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="e.g., SPORTS AUCTION"
            />
            <p className="text-xs text-slate-500 mt-1">{formData.title.length}/50 characters</p>
          </div>

          {/* Subtitle Input */}
          <div>
            <label htmlFor="subtitle" className="block text-sm font-semibold text-slate-300 mb-2">
              Subtitle / Organization Name
            </label>
            <input
              id="subtitle"
              type="text"
              required
              maxLength={100}
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="e.g., Your Organization Name"
            />
            <p className="text-xs text-slate-500 mt-1">{formData.subtitle.length}/100 characters</p>
          </div>

          {/* Preview */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <p className="text-sm font-semibold text-slate-400 mb-3">Preview</p>
            <div className="flex items-center gap-4 p-4 bg-slate-900 rounded-lg">
              {logoPreview && (
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={logoPreview} alt="Preview" className="w-full h-full object-contain" />
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-200 to-amber-400 text-transparent bg-clip-text">
                  {formData.title || 'SPORTS AUCTION'}
                </h2>
                <p className="text-sm text-amber-500/80 mt-1">
                  {formData.subtitle || 'Your Organization Name'}
                </p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
            >
              Reset to Default
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-semibold rounded-lg shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
