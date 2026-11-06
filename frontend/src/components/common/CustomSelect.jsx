import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search } from 'lucide-react';

export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select option...',
  className = '',
  buttonClassName = '',
  dropdownClassName = '',
  searchable = false,
  isMono = false,
  size = 'md', // 'sm' | 'md'
  align = 'auto', // 'auto' | 'left' | 'right'
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selectRef = useRef(null);
  const dropdownRef = useRef(null);

  // Floating coordinates for Portal rendering
  const [coords, setCoords] = useState({
    top: 0,
    left: 0,
    width: 240,
    maxHeight: 260,
    openUpward: false
  });

  // Calculate position relative to viewport
  const updatePosition = useCallback(() => {
    if (!selectRef.current) return;
    const triggerRect = selectRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Auto-close if trigger scrolls completely out of view
    if (triggerRect.bottom < -20 || triggerRect.top > viewportHeight + 20) {
      setIsOpen(false);
      return;
    }

    // Determine target width (ensures full machine name & fabric text fits without truncation)
    const idealWidth = Math.min(
      Math.max(triggerRect.width, 360),
      Math.min(viewportWidth - 24, 480)
    );

    // Determine horizontal alignment
    const shouldAlignRight =
      align === 'right' ||
      (align === 'auto' &&
        ((viewportWidth - triggerRect.left < 340) ||
          (triggerRect.right > viewportWidth / 2 && triggerRect.left > 120)));

    let left = shouldAlignRight
      ? triggerRect.right - idealWidth
      : triggerRect.left;

    // Viewport Edge Clamp: Ensure menu NEVER goes off screen
    if (left + idealWidth > viewportWidth - 12) {
      left = viewportWidth - idealWidth - 12;
    }
    if (left < 12) {
      left = 12;
    }

    // Determine vertical placement (flip upward if bottom space is tight)
    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    const openUpward = spaceBelow < 280 && spaceAbove > spaceBelow;

    const availableHeight = openUpward
      ? Math.max(160, Math.min(280, spaceAbove - 24))
      : Math.max(160, Math.min(280, spaceBelow - 24));

    const top = openUpward ? triggerRect.top - 6 : triggerRect.bottom + 6;

    setCoords({
      top,
      left,
      width: idealWidth,
      maxHeight: availableHeight,
      openUpward
    });
  }, [align]);

  // Recalculate on open, resize, or scroll anywhere in the app
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
    }
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setSearch('');
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setSearch('');
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Normalize options: supports { value, label, subtitle, status, badge } or simple strings
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      const val = opt.value !== undefined ? opt.value : opt.id;
      return {
        value: val,
        label:
          opt.label !== undefined
            ? opt.label
            : opt.name !== undefined
            ? opt.name
            : String(val ?? ''),
        subtitle: opt.subtitle || opt.fabric || opt.description,
        status: opt.status,
        badge: opt.badge
      };
    }
    return { value: opt, label: String(opt ?? '') };
  });

  const selectedOption = normalizedOptions.find(
    (opt) => String(opt.value ?? '') === String(value ?? '')
  );

  const filteredOptions =
    searchable && search
      ? normalizedOptions.filter(
          (opt) =>
            String(opt.label).toLowerCase().includes(search.toLowerCase()) ||
            (opt.subtitle &&
              String(opt.subtitle).toLowerCase().includes(search.toLowerCase()))
        )
      : normalizedOptions;

  const getStatusColor = (status) => {
    if (!status) return null;
    const s = String(status).toLowerCase();
    if (
      s === 'running' ||
      s === 'active' ||
      s === 'delivered' ||
      s === 'ready'
    )
      return 'bg-emerald-500 shadow-xs shadow-emerald-500/50';
    if (s === 'stopped' || s === 'off' || s === 'rejected' || s === 'hold')
      return 'bg-rose-500 shadow-xs shadow-rose-500/50';
    if (
      s === 'idle' ||
      s === 'break' ||
      s === 'pending' ||
      s === 'maintenance'
    )
      return 'bg-amber-500 shadow-xs shadow-amber-500/50';
    if (
      s === 'reserved' ||
      s === 'dispatched' ||
      s === 'in production'
    )
      return 'bg-sky-500 shadow-xs shadow-sky-500/50';
    return 'bg-slate-400';
  };

  const isSmall = size === 'sm';

  return (
    <div
      className={`relative ${className.includes('w-') ? '' : 'inline-block'} ${className}`}
      ref={selectRef}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!isOpen) updatePosition();
          setIsOpen(!isOpen);
        }}
        className={`w-full flex items-center justify-between gap-2 bg-white hover:bg-slate-50/80 border border-slate-200/90 hover:border-slate-300 rounded-xl text-slate-800 transition-all duration-150 shadow-2xs hover:shadow-xs active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          isSmall
            ? 'px-2.5 py-1.5 text-[11px] font-semibold'
            : 'px-3.5 py-2.5 text-xs font-semibold'
        } ${buttonClassName}`}
      >
        <div className="flex items-center gap-2 text-left min-w-0">
          {selectedOption?.status && (
            <span
              className={`rounded-full shrink-0 ${
                isSmall ? 'w-1.5 h-1.5' : 'w-2 h-2'
              } ${getStatusColor(selectedOption.status)}`}
            />
          )}
          <span
            className={`shrink-0 whitespace-nowrap ${
              isMono ? 'font-mono font-bold' : 'font-semibold'
            } text-slate-800`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.subtitle && (
            <span className="text-[11px] text-slate-500 font-normal font-sans whitespace-nowrap">
              ({selectedOption.subtitle})
            </span>
          )}
        </div>
        <ChevronDown
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${
            isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'
          } ${isOpen ? 'rotate-180 text-sky-600' : ''}`}
        />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              left: `${coords.left}px`,
              ...(coords.openUpward
                ? { bottom: `${window.innerHeight - coords.top}px` }
                : { top: `${coords.top}px` }),
              width: `${coords.width}px`,
              maxHeight: `${coords.maxHeight}px`,
              zIndex: 99999
            }}
            className={`bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-1.5 flex flex-col z-[99999] animate-in fade-in zoom-in-95 duration-100 ${dropdownClassName}`}
          >
            {searchable && normalizedOptions.length > 5 && (
              <div className="p-2 border-b border-slate-100 shrink-0">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search options..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 font-sans"
                  />
                </div>
              </div>
            )}

            <div className="overflow-y-auto modern-scrollbar px-1.5 py-1 space-y-0.5 flex-1">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-3 text-center text-xs text-slate-400 font-medium">
                  No matching options
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected =
                    String(opt.value ?? '') === String(value ?? '');
                  const statusDot = getStatusColor(opt.status);

                  return (
                    <button
                      key={String(opt.value)}
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                        setSearch('');
                      }}
                      className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs text-left transition-colors cursor-pointer group ${
                        isSelected
                          ? 'bg-sky-50 text-sky-900 font-bold'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {statusDot && (
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${statusDot}`}
                          />
                        )}
                        <span
                          className={`shrink-0 whitespace-nowrap ${
                            isMono ? 'font-mono font-bold' : 'font-semibold'
                          } ${
                            isSelected
                              ? 'font-bold text-sky-950'
                              : 'text-slate-800'
                          }`}
                        >
                          {opt.label}
                        </span>
                        {opt.subtitle && (
                          <span className="text-[11px] text-slate-500 font-normal font-sans whitespace-nowrap">
                            ({opt.subtitle})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {opt.badge && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono font-bold">
                            {opt.badge}
                          </span>
                        )}
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-sky-600 shrink-0 stroke-[2.5]" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
