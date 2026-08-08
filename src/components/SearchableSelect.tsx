import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

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
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Find currently selected option
  const selectedOption = options.find(o => o.value === value);

  // Calculate & update dropdown popover fixed position
  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Check if we should open upward (if space below is less than 240px and space above is greater)
    const openUpward = spaceBelow < 240 && spaceAbove > spaceBelow;

    const maxHeight = openUpward
      ? Math.min(280, Math.max(120, spaceAbove - 16))
      : Math.min(280, Math.max(120, spaceBelow - 16));

    const minWidth = Math.max(rect.width, 220);
    let left = rect.left;
    if (left + minWidth > window.innerWidth - 10) {
      left = Math.max(10, window.innerWidth - minWidth - 10);
    }

    setDropdownStyle({
      position: 'fixed',
      left: `${left}px`,
      width: `${Math.max(rect.width, minWidth)}px`,
      maxHeight: `${maxHeight}px`,
      zIndex: 9999,
      ...(openUpward
        ? { bottom: `${window.innerHeight - rect.top + 4}px` }
        : { top: `${rect.bottom + 4}px` })
    });
  }, []);

  // Synchronously compute position right before render paint
  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen, updatePosition]);

  // Update position on window scroll and resize
  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = (e: Event) => {
      // Don't reposition if user is scrolling inside the options list itself
      if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) {
        return;
      }
      updatePosition();
    };

    const handleResize = () => {
      updatePosition();
    };

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, updatePosition]);

  // Close when clicking outside both trigger container & portal dropdown
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

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

      {/* Floating Search & Options Dropdown Portal */}
      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          style={dropdownStyle}
          className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/90 rounded-xl shadow-2xl overflow-hidden flex flex-col p-2 space-y-2"
        >
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
        </div>,
        document.body
      )}
    </div>
  );
};

