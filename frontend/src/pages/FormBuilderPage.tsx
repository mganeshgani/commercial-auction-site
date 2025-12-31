import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';


interface FormField {
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  order: number;
}


interface SportTemplate {
  id: string;
  name: string;
  sportType: string;
  fieldCount: number;
}


const FormBuilderPage: React.FC = () => {
  const { isAuctioneer } = useAuth();
  const navigate = useNavigate();
  const [formTitle, setFormTitle] = useState('Player Registration');
  const [formDescription, setFormDescription] = useState('Fill in your details to register');
  const [sportType, setSportType] = useState('general');
  const [fields, setFields] = useState<FormField[]>([]);
  const [templates, setTemplates] = useState<SportTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);


  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';


  useEffect(() => {
    if (!isAuctioneer) {
      navigate('/login');
      return;
    }
    fetchFormConfig();
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuctioneer]);


  const fetchFormConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/form-config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFormTitle(response.data.formTitle);
      setFormDescription(response.data.formDescription);
      setSportType(response.data.sportType);
      setFields(response.data.fields);
    } catch (error) {
      console.error('Error fetching form config:', error);
    } finally {
      setLoading(false);
    }
  };


  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/form-config/templates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemplates(response.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };


  const loadTemplate = async (templateId: string) => {
    if (!window.confirm('This will replace your current form configuration. Continue?')) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/form-config/load-template/${templateId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFormTitle(response.data.formConfig.formTitle);
      setFormDescription(response.data.formConfig.formDescription);
      setSportType(response.data.formConfig.sportType);
      setFields(response.data.formConfig.fields);
      alert('Template loaded successfully!');
    } catch (error: any) {
      alert('Error loading template: ' + (error.response?.data?.error || error.message));
    }
  };


  const addField = () => {
    const newField: FormField = {
      fieldName: `field${fields.length + 1}`,
      fieldLabel: 'New Field',
      fieldType: 'text',
      required: false,
      placeholder: '',
      options: [],
      order: fields.length + 1
    };
    setFields((prev) => [...prev, newField]);
  };


  const updateField = (index: number, updates: Partial<FormField>) => {
    setFields((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };


  const removeField = (index: number) => {
    setFields((prev) => {
      const field = prev[index];
      if (['name', 'regNo', 'photo'].includes(field.fieldName)) {
        alert('Cannot remove required system fields (name, regNo, photo)');
        return prev;
      }
      return prev.filter((_, i) => i !== index);
    });
  };


  const moveField = (index: number, direction: 'up' | 'down') => {
    setFields((prev) => {
      const newFields = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newFields.length) return prev;
      [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
      newFields.forEach((field, i) => (field.order = i + 1));
      return newFields;
    });
  };


  const handleSave = async () => {
    if (fields.length === 0) {
      alert('Please add at least one field');
      return;
    }
    const hasName = fields.some((f) => f.fieldName === 'name');
    const hasRegNo = fields.some((f) => f.fieldName === 'regNo');
    const hasPhoto = fields.some((f) => f.fieldName === 'photo');
    if (!hasName || !hasRegNo || !hasPhoto) {
      alert('Form must include name, registration number, and photo fields');
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/form-config`,
        {
          formTitle,
          formDescription,
          sportType,
          fields: fields.map((f, i) => ({ ...f, order: i + 1 }))
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Form configuration saved successfully!');
      navigate('/players');
    } catch (error: any) {
      alert('Error saving form: ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-slate-800 border-t-amber-500 animate-spin" />
          <p className="text-sm text-slate-400 tracking-wide">Initializing Form Builder...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 overflow-hidden">
      {/* Fixed Header */}
      <header className="flex-shrink-0 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/60 shadow-lg z-50">
        <div className="max-w-[1920px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-amber-300">Form Builder</h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Configure registration form fields and structure
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Premium Secondary Button */}
            <button
              onClick={() => navigate('/')}
              className="group relative px-6 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-medium rounded-lg border border-slate-600/50 transition-all duration-300 overflow-hidden"
            >
              <span className="relative z-10">Return</span>
              <div className="absolute inset-0 bg-gradient-to-r from-slate-700/0 via-slate-600/20 to-slate-700/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
            
            {/* Premium Primary Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="group relative px-7 py-2.5 font-semibold rounded-lg overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 transition-all duration-300" />
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute inset-0 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3)]" />
              <span className="relative z-10 text-slate-900 text-sm flex items-center gap-2">
                {saving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Applying...
                  </>
                ) : (
                  'Save Configuration'
                )}
              </span>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 shadow-lg shadow-amber-500/30 transition-opacity duration-300" />
            </button>
          </div>
        </div>
      </header>


      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Sidebar */}
        <aside className="w-80 flex-shrink-0 border-r border-slate-800/60 bg-slate-900/40 overflow-y-auto custom-scrollbar">
          <div className="p-6 space-y-6">
            {/* Form Settings */}
            <section>
              <h2 className="text-lg font-semibold text-amber-300 mb-4">Form Configuration</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">
                    Form Title
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-slate-800/60 border-2 border-slate-700/80 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:bg-slate-800/80 transition-all"
                    placeholder="e.g., Professional Player Registration"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">
                    Form Description
                  </label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 text-sm bg-slate-800/60 border-2 border-slate-700/80 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:bg-slate-800/80 resize-none transition-all"
                    placeholder="Provide a brief overview of the registration requirements..."
                  />
                </div>
              </div>
            </section>


            {/* Templates */}
            <section>
              <h2 className="text-lg font-semibold text-amber-300 mb-4">Template Library</h2>
              <div className="space-y-2">
                {templates.length === 0 ? (
                  <div className="text-center py-6 px-4 border border-dashed border-slate-700/60 rounded-lg bg-slate-800/20">
                    <p className="text-xs text-slate-500">No templates available</p>
                  </div>
                ) : (
                  templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => loadTemplate(template.id)}
                      className="group w-full text-left px-4 py-3 bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/60 hover:border-amber-500/40 rounded-lg transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-100 text-sm group-hover:text-amber-300 transition-colors">
                            {template.name}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {template.fieldCount} field{template.fieldCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <span className="text-xs px-3 py-1.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium group-hover:bg-amber-500/25 transition-colors">
                          Apply
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </section>
          </div>
        </aside>


        {/* Main Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-5xl mx-auto p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-amber-300">Field Configuration</h2>
                <span className="px-3 py-1.5 bg-amber-500/15 border border-amber-500/30 rounded-full text-sm text-amber-200 font-medium">
                  {fields.length} {fields.length === 1 ? 'Field' : 'Fields'}
                </span>
              </div>
              
              {/* Premium Add Button */}
              <button
                onClick={addField}
                className="group relative px-5 py-2.5 font-semibold rounded-lg overflow-hidden transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500" />
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-0 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3)]" />
                <span className="relative z-10 text-slate-900 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Field
                </span>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 shadow-lg shadow-amber-500/30 transition-opacity duration-300" />
              </button>
            </div>


            {/* Fields List */}
            <div className="space-y-5">
              {fields.length === 0 ? (
                <div className="bg-slate-900/40 border-2 border-dashed border-slate-700/60 rounded-2xl p-16 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center">
                      <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-300 mb-2">No Fields Configured</h3>
                    <p className="text-sm text-slate-500 mb-8">
                      Begin by adding custom fields or load a pre-configured template
                    </p>
                    <button
                      onClick={addField}
                      className="group relative px-6 py-3 font-semibold rounded-lg overflow-hidden transition-all duration-300"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500" />
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <span className="relative z-10 text-slate-900 text-sm">Create First Field</span>
                    </button>
                  </div>
                </div>
              ) : (
                fields.map((field, index) => {
                  const isProtected = ['name', 'photo'].includes(field.fieldName);
                  return (
                    <div
                      key={index}
                      className="bg-slate-900/50 border border-slate-800/60 rounded-xl overflow-hidden hover:border-slate-700/80 transition-all duration-300"
                    >
                      {/* Field Header */}
                      <div className="bg-slate-950/40 px-5 py-3.5 flex items-center justify-between border-b border-slate-800/60">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/15 text-amber-300 text-sm font-bold border border-amber-500/30">
                            {index + 1}
                          </span>
                          <div>
                            <span className="text-base font-semibold text-slate-100">
                              {field.fieldLabel || 'Untitled Field'}
                            </span>
                            <span className="ml-2 text-xs text-slate-500 font-mono">
                              {field.fieldName || 'no-identifier'}
                            </span>
                          </div>
                          {isProtected && (
                            <span className="px-2.5 py-1 rounded-md bg-blue-500/15 border border-blue-500/30 text-xs text-blue-300 font-semibold">
                              System Required
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Icon Buttons */}
                          <button
                            onClick={() => moveField(index, 'up')}
                            disabled={index === 0}
                            className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/60 hover:border-slate-600 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                            title="Move field up"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => moveField(index, 'down')}
                            disabled={index === fields.length - 1}
                            className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/60 hover:border-slate-600 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                            title="Move field down"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => removeField(index)}
                            disabled={isProtected}
                            className="p-2 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 hover:border-red-500/50 text-red-400 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                            title={isProtected ? 'System field cannot be removed' : 'Remove field'}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>


                      {/* Field Content */}
                      <div className="p-6 space-y-5">
                        {/* Row 1 */}
                        <div className="grid grid-cols-2 gap-5">
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-2.5 uppercase tracking-wide">
                              Field Identifier
                            </label>
                            <input
                              type="text"
                              value={field.fieldName}
                              onChange={(e) => updateField(index, { fieldName: e.target.value })}
                              disabled={isProtected}
                              className="w-full px-4 py-2.5 text-sm bg-slate-800/60 border-2 border-slate-700/80 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:bg-slate-800/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                              placeholder="e.g., playerPosition"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-2.5 uppercase tracking-wide">
                              Display Label
                            </label>
                            <input
                              type="text"
                              value={field.fieldLabel}
                              onChange={(e) => updateField(index, { fieldLabel: e.target.value })}
                              className="w-full px-4 py-2.5 text-sm bg-slate-800/60 border-2 border-slate-700/80 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:bg-slate-800/80 transition-all"
                              placeholder="e.g., Player Position"
                            />
                          </div>
                        </div>


                        {/* Row 2 */}
                        <div className="grid grid-cols-2 gap-5">
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-2.5 uppercase tracking-wide">
                              Input Type
                            </label>
                            <select
                              value={field.fieldType}
                              onChange={(e) => updateField(index, { fieldType: e.target.value })}
                              disabled={isProtected}
                              className="w-full px-4 py-2.5 text-sm bg-slate-800/60 border-2 border-slate-700/80 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500/60 focus:bg-slate-800/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                              <option value="text">Text Input</option>
                              <option value="number">Numeric Input</option>
                              <option value="select">Dropdown Selection</option>
                              <option value="textarea">Multi-line Text</option>
                              <option value="date">Date Selection</option>
                              <option value="email">Email Address</option>
                              <option value="tel">Phone Number</option>
                              <option value="file">File Upload</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-2.5 uppercase tracking-wide">
                              Placeholder Text
                            </label>
                            <input
                              type="text"
                              value={field.placeholder || ''}
                              onChange={(e) => updateField(index, { placeholder: e.target.value })}
                              className="w-full px-4 py-2.5 text-sm bg-slate-800/60 border-2 border-slate-700/80 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:bg-slate-800/80 transition-all"
                              placeholder="Enter descriptive hint text..."
                            />
                          </div>
                        </div>


                        {/* Dropdown Options */}
                        {field.fieldType === 'select' && (
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-2.5 uppercase tracking-wide">
                              Selection Options
                              <span className="ml-2 text-[10px] text-slate-500 font-normal normal-case">
                                (separate with commas)
                              </span>
                            </label>
                            <textarea
                              rows={3}
                              key={`options-${index}`}
                              defaultValue={(field.options || []).join(', ')}
                              onBlur={(e) => {
                                const options = e.target.value
                                  .split(',')
                                  .map((s) => s.trim())
                                  .filter(Boolean);
                                updateField(index, { options });
                              }}
                              className="w-full px-4 py-2.5 text-sm bg-slate-800/60 border-2 border-slate-700/80 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:bg-slate-800/80 transition-all resize-none"
                              placeholder="Forward, Midfielder, Defender, Goalkeeper"
                            />
                            {field.options && field.options.length > 0 && (
                              <div className="mt-3 p-4 bg-slate-800/40 border border-slate-700/60 rounded-lg">
                                <p className="text-xs text-slate-400 mb-3 font-medium">
                                  Options Preview · {field.options.length} {field.options.length === 1 ? 'option' : 'options'}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {field.options.map((opt, optIdx) => (
                                    <span
                                      key={optIdx}
                                      className="inline-flex items-center px-3 py-1.5 text-xs bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded-md font-medium"
                                    >
                                      {opt}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}


                        {/* Required Checkbox */}
                        <div className="pt-4 border-t border-slate-800/60">
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => updateField(index, { required: e.target.checked })}
                              disabled={isProtected}
                              className="w-4 h-4 rounded border-slate-600 text-amber-500 focus:ring-2 focus:ring-amber-500/50 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
                            />
                            <span className="text-sm text-slate-300 group-hover:text-slate-100 transition-colors">
                              Mandatory field
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>


            {/* Add Another Field Button */}
            {fields.length > 0 && (
              <div className="mt-6">
                <button
                  onClick={addField}
                  className="w-full px-6 py-4 text-sm bg-slate-800/40 hover:bg-slate-800/60 border-2 border-dashed border-slate-700/60 hover:border-amber-500/40 text-slate-400 hover:text-amber-300 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Additional Field
                </button>
              </div>
            )}


            <div className="h-20"></div>
          </div>
        </main>
      </div>


      {/* Footer */}
      <footer className="flex-shrink-0 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/60 shadow-lg z-50">
        <div className="max-w-[1920px] mx-auto px-6 py-4 flex items-center justify-between">
          <p className="text-xs text-slate-500 flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500/60 animate-pulse"></span>
            Changes are not persisted automatically
          </p>
          <div className="flex items-center gap-3">
            {/* Secondary Footer Button */}
            <button
              onClick={() => navigate('/')}
              className="group relative px-5 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-medium rounded-lg border border-slate-600/50 transition-all duration-300 overflow-hidden"
            >
              <span className="relative z-10">Discard</span>
              <div className="absolute inset-0 bg-gradient-to-r from-slate-700/0 via-slate-600/20 to-slate-700/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
            
            {/* Primary Footer Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="group relative px-8 py-2.5 font-semibold rounded-lg overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500" />
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute inset-0 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3)]" />
              <span className="relative z-10 text-slate-900 text-sm">
                {saving ? 'Applying...' : 'Apply Configuration'}
              </span>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 shadow-lg shadow-amber-500/30 transition-opacity duration-300" />
            </button>
          </div>
        </div>
      </footer>


      {/* Scrollbar */}
      <style>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(251, 191, 36, 0.4) transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(251, 191, 36, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(251, 191, 36, 0.5);
        }
      `}</style>
    </div>
  );
};


export default FormBuilderPage;
