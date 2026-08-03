import React, { useState, useRef, useEffect } from 'react';

export interface SearchableOption {
  value: string;
  label: string;
  badge?: string;
  isAllowed?: boolean;
  sublabel?: string;
}

interface SearchableSelectProps {
  value: string;
  options: SearchableOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  options,
  onChange,
  placeholder = 'Select option...',
  className = '',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Find currently selected option
  const selectedOption = options.find(o => o.value === value);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  const filteredOptions = options.filter(opt => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      opt.label.toLowerCase().includes(q) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(q)) ||
      (opt.badge && opt.badge.toLowerCase().includes(q)) ||
      opt.value.toLowerCase().includes(q)
    );
  });

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const getDisplayLabel = () => {
    if (selectedOption) {
      const allowedStr = selectedOption.isAllowed === false ? '⚠️ ' : '';
      const sub = selectedOption.sublabel ? ` ${selectedOption.sublabel}` : '';
      const badge = selectedOption.badge ? ` [${selectedOption.badge}]` : '';
      return `${allowedStr}${selectedOption.label}${sub}${badge}`;
    }
    if (value && value !== 'none') return value;
    return placeholder;
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between input-field text-xs gap-2 text-left ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-slate-600'
        } ${selectedOption?.isAllowed === false ? 'text-rose-300' : 'text-slate-200'}`}
      >
        <span className="truncate font-medium">{getDisplayLabel()}</span>
        <i className={`fa-solid fa-chevron-down text-[10px] text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-amber-400' : ''}`}></i>
      </button>

      {/* Floating Search & Options Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl z-50 max-h-72 overflow-hidden flex flex-col p-2 space-y-2">
          {/* Search Header */}
          <div className="relative shrink-0">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs"></i>
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search options..."
              className="input-field pl-8 pr-7 text-xs py-1.5 w-full bg-slate-950/90 text-amber-300 placeholder-slate-500 font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200 text-xs"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="overflow-y-auto flex-1 space-y-1 pr-1 scrollbar-thin">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-500 italic">
                No matching options found for "{searchTerm}"
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isRestricted = opt.isAllowed === false;

                return (
                  <div
                    key={`${opt.value}_${idx}`}
                    onClick={() => handleSelect(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs cursor-pointer flex items-center justify-between transition-colors gap-2 ${
                      isSelected
                        ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                        : isRestricted
                          ? 'text-slate-300 hover:bg-slate-800/80 hover:text-rose-300'
                          : 'text-slate-200 hover:bg-slate-800/80 hover:text-amber-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {isRestricted && <span className="text-rose-400 text-[11px]">⚠️</span>}
                      <span className="truncate">{opt.label}</span>
                      {opt.sublabel && <span className="text-[11px] text-slate-400 font-mono shrink-0">{opt.sublabel}</span>}
                    </div>

                    {opt.badge && (
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold shrink-0 ${
                        isRestricted
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {opt.badge}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
