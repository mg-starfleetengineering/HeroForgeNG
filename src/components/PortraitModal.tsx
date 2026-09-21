import React, { useState, useRef } from 'react';
import { FANTASY_AVATAR_PRESETS, compressAndConvertToBase64 } from '../engine/portrait';

interface PortraitModalProps {
  currentPortraitUrl?: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectPortrait: (url: string | undefined) => void;
}

export const PortraitModal: React.FC<PortraitModalProps> = ({
  currentPortraitUrl,
  isOpen,
  onClose,
  onSelectPortrait
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileProcess = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, WebP, GIF).');
      return;
    }
    setErrorMsg(null);
    setIsProcessing(true);
    try {
      const compressedDataUrl = await compressAndConvertToBase64(file);
      onSelectPortrait(compressedDataUrl);
      setIsProcessing(false);
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to process uploaded image. Try another file.');
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) {
      setErrorMsg('Please enter a valid image URL.');
      return;
    }
    onSelectPortrait(urlInput.trim());
    onClose();
  };

  const handleRemove = () => {
    onSelectPortrait(undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <i className="fa-solid fa-user-gear text-lg"></i>
            </div>
            <div>
              <h2 className="text-lg font-bold font-heading text-slate-100">Character Portrait</h2>
              <p className="text-xs text-slate-400">Upload a custom picture, paste an image link, or pick a preset</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center transition"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Current Portrait Preview */}
        <div className="flex items-center gap-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <div className="w-16 h-16 rounded-xl border-2 border-amber-500/40 bg-slate-900 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
            {currentPortraitUrl ? (
              <img src={currentPortraitUrl} alt="Character Portrait" className="w-full h-full object-cover" />
            ) : (
              <i className="fa-solid fa-user-shield text-3xl text-slate-600"></i>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs text-slate-400 block font-semibold">Active Portrait</span>
            <p className="text-sm font-semibold text-slate-200 truncate">
              {currentPortraitUrl ? (currentPortraitUrl.startsWith('data:') ? 'Custom Uploaded Image' : 'Custom Image URL') : 'Default Hero Icon'}
            </p>
            {currentPortraitUrl && (
              <button
                onClick={handleRemove}
                className="text-xs text-red-400 hover:text-red-300 font-semibold mt-1 inline-flex items-center gap-1"
              >
                <i className="fa-solid fa-trash-can"></i> Remove Portrait
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 text-xs font-semibold">
          <button
            onClick={() => { setActiveTab('upload'); setErrorMsg(null); }}
            className={`px-4 py-2 border-b-2 transition-colors ${activeTab === 'upload' ? 'border-amber-500 text-amber-400 bg-amber-500/10' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <i className="fa-solid fa-cloud-arrow-up mr-1.5"></i> File Upload
          </button>
          <button
            onClick={() => { setActiveTab('url'); setErrorMsg(null); }}
            className={`px-4 py-2 border-b-2 transition-colors ${activeTab === 'url' ? 'border-amber-500 text-amber-400 bg-amber-500/10' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <i className="fa-solid fa-link mr-1.5"></i> Image URL
          </button>
          <button
            onClick={() => { setActiveTab('presets'); setErrorMsg(null); }}
            className={`px-4 py-2 border-b-2 transition-colors ${activeTab === 'presets' ? 'border-amber-500 text-amber-400 bg-amber-500/10' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <i className="fa-solid fa-wand-magic-sparkles mr-1.5"></i> Presets
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
            <i className="fa-solid fa-triangle-exclamation text-sm"></i> {errorMsg}
          </div>
        )}

        {/* Tab content */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3 ${
                isDragging ? 'border-amber-400 bg-amber-500/10 scale-[0.99]' : 'border-slate-700 bg-slate-950/40 hover:border-amber-500/50 hover:bg-slate-950/80'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              {isProcessing ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin text-3xl text-amber-400"></i>
                  <p className="text-sm font-semibold text-amber-300">Processing & Optimizing Image...</p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center text-xl shadow-md">
                    <i className="fa-solid fa-image"></i>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-200">Click to browse or drag & drop</p>
                    <p className="text-xs text-slate-400 mt-1">PNG, JPG, WebP or GIF (Automatically optimized for fast saving)</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'url' && (
          <form onSubmit={handleUrlSubmit} className="space-y-4">
            <div>
              <label className="label-text">Direct Web Image Link</label>
              <input
                type="url"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder="https://example.com/character-portrait.png"
                className="input-field"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose} className="btn btn-secondary text-xs">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary text-xs">
                <i className="fa-solid fa-check"></i> Apply Image URL
              </button>
            </div>
          </form>
        )}

        {activeTab === 'presets' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">Choose a styled fantasy avatar preset for your character:</p>
            <div className="grid grid-cols-4 gap-3 max-h-56 overflow-y-auto pr-1">
              {FANTASY_AVATAR_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => {
                    onSelectPortrait(preset.url);
                    onClose();
                  }}
                  className="group flex flex-col items-center p-2 bg-slate-950/60 border border-slate-800 hover:border-amber-500 rounded-xl transition hover:scale-105"
                >
                  <img src={preset.url} alt={preset.name} className="w-14 h-14 rounded-lg object-cover mb-1 shadow-md" />
                  <span className="text-[10px] font-semibold text-slate-300 group-hover:text-amber-300 truncate w-full text-center">
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
