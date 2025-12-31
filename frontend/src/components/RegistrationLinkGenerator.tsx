import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RegistrationLinkGenerator: React.FC = () => {
  const [registrationLink, setRegistrationLink] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasFormConfig, setHasFormConfig] = useState<boolean>(false);
  const [checkingConfig, setCheckingConfig] = useState<boolean>(true);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

  useEffect(() => {
    checkFormConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkFormConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/form-config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Check if form config exists and has fields
      if (response.data && response.data.fields && response.data.fields.length > 0) {
        setHasFormConfig(true);
        generateLink();
      } else {
        setHasFormConfig(false);
      }
    } catch (error) {
      console.error('Error checking form config:', error);
      setHasFormConfig(false);
    } finally {
      setCheckingConfig(false);
    }
  };

  const generateLink = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API_URL}/auth/generate-registration-link`,
        {},
        { 
          withCredentials: true,
          headers: token ? {
            'Authorization': `Bearer ${token}`
          } : {}
        }
      );

      if (response.data.success) {
        setRegistrationLink(response.data.data.url);
      }
    } catch (err: any) {
      console.error('Error generating link:', err);
      setError(err.response?.data?.error || 'Failed to generate registration link');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(registrationLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareViaWhatsApp = () => {
    const message = `Register for the Sports Auction!\n\nClick here to register: ${registrationLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (checkingConfig) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all shadow-lg opacity-50 cursor-not-allowed"
        style={{
          background: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)',
          color: '#ffffff',
          border: '1px solid rgba(156, 163, 175, 0.3)'
        }}
      >
        <div className="animate-spin rounded-full h-3.5 w-3.5 border-t-2 border-b-2 border-white"></div>
        Checking...
      </button>
    );
  }

  if (!hasFormConfig) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg" style={{
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%)',
        color: '#fca5a5',
        border: '1px solid rgba(239, 68, 68, 0.3)'
      }}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        Create Form Builder First
      </div>
    );
  }

  return (
    <>
      {loading ? (
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all shadow-lg opacity-50 cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
            color: '#1e293b',
            border: '1px solid rgba(251, 191, 36, 0.3)'
          }}
        >
          <div className="animate-spin rounded-full h-3.5 w-3.5 border-t-2 border-b-2 border-slate-900"></div>
          Loading...
        </button>
      ) : error ? (
        <button
          onClick={generateLink}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
            color: '#ffffff',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(220, 38, 38, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Retry Link
        </button>
      ) : registrationLink ? (
        <div className="flex items-center gap-2">
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all shadow-lg"
            style={{
              background: copied 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
              color: '#1e293b',
              border: `1px solid ${copied ? 'rgba(16, 185, 129, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`
            }}
            onMouseEnter={(e) => {
              if (!copied) {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(217, 119, 6, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!copied) {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
              }
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {copied ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              )}
            </svg>
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
          <button
            onClick={shareViaWhatsApp}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
            }}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            WhatsApp
          </button>
        </div>
      ) : null}
    </>
  );
};

export default RegistrationLinkGenerator;
