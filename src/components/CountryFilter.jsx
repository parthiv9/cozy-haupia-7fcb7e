import { useId, useEffect, useRef, useState, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { NEWS_REGION_OPTIONS } from '../config/newsRegions';

const ICON_STROKE = 2;

/**
 * @typedef {import('../config/newsRegions').NewsRegionOption} NewsRegionOption
 */

/**
 * @param {{
 *   options?: NewsRegionOption[],
 *   value: string,
 *   onChange: (code: string) => void,
 *   disabled?: boolean,
 *   layoutGroupId?: string,
 * }} props
 */
export default function CountryFilter({
  options = NEWS_REGION_OPTIONS,
  value,
  onChange,
  disabled = false,
  layoutGroupId: _layoutGroupId,
}) {
  const labelId = useId();
  const listboxId = useId();
  const triggerRef = useRef(/** @type {HTMLButtonElement | null} */ (null));
  const listRef = useRef(/** @type {HTMLUListElement | null} */ (null));
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(/** @type {number} */ (-1));

  const resolvedValue = options.some((o) => o.code === value) ? value : (options[0]?.code ?? '');
  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.code === resolvedValue)
  );
  const selected = options[selectedIndex] ?? options[0];

  useEffect(() => {
    if (options.length && !options.some((o) => o.code === value) && options[0]) {
      onChange(options[0].code);
    }
  }, [value, options, onChange]);

  const close = useCallback(() => {
    setOpen(false);
    setHighlight(-1);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      const t = e.target;
      if (t instanceof Node && triggerRef.current?.contains(t)) return;
      if (t instanceof Node && listRef.current?.contains(t)) return;
      close();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      listRef.current?.querySelector(`[data-index="${highlight >= 0 ? highlight : selectedIndex}"]`)?.scrollIntoView({
        block: 'nearest',
      });
    });
    return () => cancelAnimationFrame(id);
  }, [open, highlight, selectedIndex]);

  const choose = useCallback(
    (code) => {
      onChange(code);
      close();
      triggerRef.current?.focus();
    },
    [onChange, close]
  );

  const onTriggerKeyDown = (e) => {
    if (disabled) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setHighlight(selectedIndex);
        return;
      }
      const i = highlight >= 0 ? highlight : selectedIndex;
      const next =
        e.key === 'ArrowDown'
          ? Math.min(options.length - 1, i + 1)
          : Math.max(0, i - 1);
      setHighlight(next);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setHighlight(selectedIndex);
        return;
      }
      if (highlight >= 0) choose(options[highlight].code);
      else choose(options[selectedIndex].code);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'Home') {
      e.preventDefault();
      if (open) setHighlight(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      if (open) setHighlight(options.length - 1);
    }
  };

  const onListKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      triggerRef.current?.focus();
    }
  };

  const displayLabel = selected ? `${selected.label} (${selected.short})` : '';

  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      <span
        id={labelId}
        className="text-[10px] font-semibold uppercase tracking-[0.22em] text-app-fg/55"
      >
        Region
      </span>
      <div className="relative w-full min-w-0">
        <button
          ref={triggerRef}
          type="button"
          id={`${labelId}-trigger`}
          className={`
            flex w-full min-h-[48px] items-center justify-between gap-3 rounded-2xl border border-sky-300/55 bg-white/55 px-4 py-3
            text-left text-sm font-semibold text-slate-900 shadow-sm backdrop-blur-md transition-[border-color,box-shadow,background-color]
            hover:border-sky-400/65 hover:bg-white/70 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/45 focus:ring-offset-2 focus:ring-offset-transparent
            disabled:cursor-not-allowed disabled:opacity-55
            app-night:border-sky-400/35 app-night:bg-slate-900/45 app-night:text-slate-100 app-night:hover:border-sky-400/50
            app-night:hover:bg-slate-900/55 app-night:focus:ring-sky-400/35
          `.trim()}
          aria-labelledby={labelId}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          disabled={disabled}
          onClick={() => {
            if (disabled) return;
            setOpen((v) => !v);
            setHighlight(-1);
          }}
          onKeyDown={onTriggerKeyDown}
        >
          <span className="min-w-0 truncate">{displayLabel}</span>
          <ChevronDown
            className={`h-[18px] w-[18px] shrink-0 text-slate-500 transition-transform duration-200 app-night:text-slate-400 ${
              open ? 'rotate-180' : ''
            }`}
            strokeWidth={ICON_STROKE}
            aria-hidden
          />
        </button>

        {open && !disabled && (
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            tabIndex={-1}
            aria-labelledby={labelId}
            aria-activedescendant={
              highlight >= 0 ? `${listboxId}-opt-${options[highlight].code}` : undefined
            }
            onKeyDown={onListKeyDown}
            className="absolute left-0 right-0 z-[80] mt-2 max-h-[min(22rem,55vh)] overflow-y-auto rounded-xl border border-slate-200/95 bg-white py-1.5 shadow-[0_12px_40px_-8px_rgba(15,23,42,0.18),0_4px_12px_-4px_rgba(15,23,42,0.1)] app-night:border-slate-600/80 app-night:bg-slate-900 app-night:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.45)]"
          >
            {options.map((c, index) => {
              const isSelected = c.code === resolvedValue;
              const isHighlighted = highlight === index;
              return (
                <li
                  key={c.code}
                  id={`${listboxId}-opt-${c.code}`}
                  role="option"
                  aria-selected={isSelected}
                  data-index={index}
                  className={`
                    cursor-pointer px-4 py-3.5 text-sm font-medium transition-colors
                    ${
                      isSelected
                        ? 'bg-sky-500 text-white'
                        : isHighlighted
                          ? 'bg-slate-100 text-slate-900 app-night:bg-slate-800 app-night:text-slate-100'
                          : 'text-slate-900 app-night:text-slate-100'
                    }
                    ${!isSelected ? 'hover:bg-slate-100 app-night:hover:bg-slate-800/90' : ''}
                  `.trim()}
                  onMouseEnter={() => setHighlight(index)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(c.code)}
                >
                  {c.label} ({c.short})
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export { NEWS_REGION_OPTIONS as COUNTRIES } from '../config/newsRegions';
