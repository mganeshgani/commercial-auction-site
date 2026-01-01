import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Player } from '../types';

interface FormField {
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  order: number;
}

interface EditPlayerModalProps {
  player: Player | null;
  onClose: () => void;
  onSuccess: () => void;
}

const EditPlayerModal: React.FC<EditPlayerModalProps> = ({ player, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>(player?.photoUrl || '');
  const [loading, setLoading] = useState(false);
  const [loadingFields, setLoadingFields] = useState(true);
  const [error, setError] = useState<string>('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
  const isAddMode = !player;

  const fetchFormConfig = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/form-config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const fields = response.data.fields || [];
      setFormFields(fields);
      
      // Initialize form data with existing player data or empty values
      const initialData: Record<string, any> = {};
      fields.forEach((field: FormField) => {
        if (player && (player as any)[field.fieldName] !== undefined) {
          initialData[field.fieldName] = (player as any)[field.fieldName];
        } else {
          initialData[field.fieldName] = '';
        }
      });
      setFormData(initialData);
    } catch (error) {
      console.error('Error fetching form config:', error);
      // Fallback to basic fields if form config doesn't exist
      setFormFields([
        { fieldName: 'name', fieldLabel: 'Player Name', fieldType: 'text', required: true, placeholder: 'Enter full name', order: 1 },
        { fieldName: 'regNo', fieldLabel: 'Registration Number', fieldType: 'text', required: false, placeholder: 'Auto-generated if empty', order: 2 },
        { fieldName: 'class', fieldLabel: 'Class', fieldType: 'text', required: true, placeholder: 'Enter class', order: 3 },
        { fieldName: 'position', fieldLabel: 'Position', fieldType: 'text', required: true, placeholder: 'Enter position', order: 4 },
        { fieldName: 'photo', fieldLabel: 'Player Photo', fieldType: 'file', required: true, order: 5 }
      ]);
      const initialData: Record<string, any> = {
        name: player?.name || '',
        regNo: player?.regNo || '',
        class: player?.class || '',
        position: player?.position || ''
      };
      setFormData(initialData);
    } finally {
      setLoadingFields(false);
    }
  }, [API_URL, player]);

  // Fetch form configuration on mount
  useEffect(() => {
    fetchFormConfig();
  }, [fetchFormConfig]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate photo for add mode only if photo field is required
    const photoField = formFields.find(f => f.fieldName === 'photo');
    if (isAddMode && photoField?.required && !photo) {
      setError('Please upload a player photo');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // Close modal immediately for better UX (optimistic update)
      onClose();
      
      // Prepare form data with all dynamic fields
      const submitData = new FormData();
      
      // Add all form fields except photo
      Object.keys(formData).forEach(key => {
        if (key !== 'photo' && formData[key]) {
          submitData.append(key, formData[key]);
        }
      });
      
      // Add photo if present
      if (photo) {
        submitData.append('photo', photo);
      }

      if (isAddMode) {
        // Add new player
        await axios.post(`${API_URL}/players`, submitData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        // Update existing player
        await axios.put(`${API_URL}/players/${player._id}`, submitData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      
      onSuccess();
    } catch (err: any) {
      console.error('Error:', err);
      alert(err.response?.data?.error || `Failed to ${isAddMode ? 'add' : 'update'} player. Please try again.`);
      // Refresh the list even on error to show any partial updates
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field: FormField) => {
    // Skip photo field - it's handled separately
    if (field.fieldType === 'file') {
      return null;
    }

    const value = formData[field.fieldName] || '';

    switch (field.fieldType) {
      case 'select':
        return (
          <div key={field.fieldName}>
            <label className="block text-sm font-bold text-gray-300 mb-2">
              {field.fieldLabel} {field.required && <span className="text-red-400">*</span>}
            </label>
            <select
              name={field.fieldName}
              value={value}
              onChange={handleInputChange}
              required={field.required}
              className="w-full px-4 py-3 bg-slate-900/60 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-amber-500 transition-colors"
            >
              <option value="">Select {field.fieldLabel}</option>
              {field.options?.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        );
      
      case 'textarea':
        return (
          <div key={field.fieldName}>
            <label className="block text-sm font-bold text-gray-300 mb-2">
              {field.fieldLabel} {field.required && <span className="text-red-400">*</span>}
            </label>
            <textarea
              name={field.fieldName}
              value={value}
              onChange={handleInputChange}
              required={field.required}
              placeholder={field.placeholder}
              rows={3}
              className="w-full px-4 py-3 bg-slate-900/60 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-amber-500 transition-colors resize-none"
            />
          </div>
        );
      
      case 'number':
      case 'email':
      case 'tel':
      case 'date':
      case 'text':
      default:
        return (
          <div key={field.fieldName}>
            <label className="block text-sm font-bold text-gray-300 mb-2">
              {field.fieldLabel} {field.required && <span className="text-red-400">*</span>}
            </label>
            <input
              type={field.fieldType}
              name={field.fieldName}
              value={value}
              onChange={handleInputChange}
              required={field.required}
              placeholder={field.placeholder || ''}
              className="w-full px-4 py-3 bg-slate-900/60 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        );
    }
  };

  if (loadingFields) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-amber-500/30 p-6 max-w-md w-full shadow-2xl">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
          </div>
          <p className="text-center text-gray-400 mt-4">Loading form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-amber-500/30 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black" style={{
            background: 'linear-gradient(135deg, #FFFFFF 0%, #F0D770 50%, #D4AF37 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            {isAddMode ? 'Add Player' : 'Edit Player'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo Upload - Check if photo field exists in form config */}
          {formFields.some(f => f.fieldType === 'file') && (
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Player Photo {formFields.find(f => f.fieldType === 'file')?.required && isAddMode && <span className="text-red-400">*</span>}
              </label>
              <div className="flex items-center gap-4">
                {photoPreview ? (
                  <img 
                    src={photoPreview} 
                    alt="Preview" 
                    className="w-20 h-20 rounded-full object-cover border-4 border-amber-500/50"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center text-3xl text-gray-400">
                    👤
                  </div>
                )}
                <label className="flex-1 cursor-pointer">
                  <div className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-center text-sm font-semibold text-white transition-colors">
                    {photo ? 'Change Photo' : isAddMode ? 'Upload Photo' : 'Update Photo'}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              </div>
              {formFields.find(f => f.fieldType === 'file')?.required && isAddMode && !photoPreview && (
                <p className="text-xs text-gray-400 mt-1">Photo is required for new players</p>
              )}
            </div>
          )}

          {/* Render all dynamic fields */}
          {formFields.sort((a, b) => a.order - b.order).map(field => renderField(field))}

          {error && (
            <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 disabled:from-gray-600 disabled:to-gray-700 rounded-lg font-bold text-white transition-all duration-300 disabled:cursor-not-allowed"
            >
              {loading ? (
                isAddMode ? (
                  photo ? 'Uploading...' : 'Adding...'
                ) : (
                  photo ? 'Uploading...' : 'Saving...'
                )
              ) : (
                isAddMode ? 'Add Player' : 'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPlayerModal;
