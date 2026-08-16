import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { ChevronDown, X } from 'lucide-react';
import './SearchableSelect.css';

export interface SearchableSelectOption {
  value: string;
  label: string;
  description?: string;
}

export interface SearchableSelectProps {
  id: string;
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  noMatchesMessage?: string;
  'aria-invalid'?: boolean | 'true' | 'false';
  className?: string;
  filterOption?: (option: SearchableSelectOption, query: string) => boolean;
  renderOption?: (option: SearchableSelectOption) => ReactNode;
}

function defaultFilter(option: SearchableSelectOption, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  if (option.label.toLowerCase().includes(needle)) {
    return true;
  }
  return Boolean(option.description?.toLowerCase().includes(needle));
}

export function SearchableSelect({
  id,
  options,
  value,
  onChange,
  placeholder = 'Search…',
  disabled = false,
  loading = false,
  noMatchesMessage = 'No results found',
  'aria-invalid': ariaInvalid,
  className,
  filterOption = defaultFilter,
  renderOption,
}: SearchableSelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const selected = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  );

  const filtered = useMemo(
    () => options.filter((option) => filterOption(option, query)),
    [options, query, filterOption],
  );

  useEffect(() => {
    if (!open) {
      setQuery(selected?.label ?? '');
    }
  }, [selected, open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query, open]);

  function selectOption(option: SearchableSelectOption) {
    onChange(option.value);
    setQuery(option.label);
    setOpen(false);
    inputRef.current?.focus();
  }

  function clearSelection() {
    onChange('');
    setQuery('');
    setOpen(true);
    inputRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setHighlightedIndex((current) => Math.min(current + 1, Math.max(filtered.length - 1, 0)));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      setHighlightedIndex((current) => Math.max(current - 1, 0));
      return;
    }
    if (event.key === 'Enter' && open) {
      const highlighted = filtered[highlightedIndex];
      if (highlighted) {
        event.preventDefault();
        selectOption(highlighted);
      }
      return;
    }
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      setOpen(false);
      setQuery(selected?.label ?? '');
    }
  }

  const activeOptionId =
    open && filtered[highlightedIndex]
      ? `${listId}-option-${filtered[highlightedIndex].value}`
      : undefined;
  const showClear = Boolean(value) && !disabled && !loading;

  return (
    <div
      ref={rootRef}
      className={['searchable-select', className].filter(Boolean).join(' ')}
      data-searchable-select=""
    >
      <div className="searchable-select__control">
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          autoComplete="off"
          spellCheck={false}
          placeholder={loading ? 'Loading…' : placeholder}
          value={open ? query : (selected?.label ?? query)}
          disabled={disabled || loading}
          aria-invalid={ariaInvalid}
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeOptionId}
          className="searchable-select__input"
          onFocus={() => {
            if (!disabled && !loading) {
              setQuery(selected?.label ?? '');
              setOpen(true);
            }
          }}
          onChange={(event) => {
            const next = event.target.value;
            setQuery(next);
            setOpen(true);
            if (selected && next !== selected.label) {
              onChange('');
            }
          }}
          onKeyDown={handleKeyDown}
        />
        {showClear ? (
          <button
            type="button"
            className="searchable-select__clear"
            aria-label="Clear selection"
            onClick={clearSelection}
          >
            <X size={14} strokeWidth={2} aria-hidden="true" />
          </button>
        ) : (
          <ChevronDown
            className="searchable-select__chevron"
            aria-hidden="true"
            size={16}
            strokeWidth={1.75}
          />
        )}
      </div>

      {open && !loading ? (
        <ul id={listId} className="searchable-select__list" role="listbox" aria-label="Options">
          {filtered.length === 0 ? (
            <li className="searchable-select__empty" role="presentation">
              {noMatchesMessage}
            </li>
          ) : (
            filtered.map((option, index) => (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  id={`${listId}-option-${option.value}`}
                  role="option"
                  aria-selected={value === option.value}
                  className={
                    index === highlightedIndex
                      ? 'searchable-select__option is-active'
                      : 'searchable-select__option'
                  }
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectOption(option)}
                >
                  {renderOption ? (
                    renderOption(option)
                  ) : (
                    <>
                      <span className="searchable-select__option-label">{option.label}</span>
                      {option.description ? (
                        <span className="searchable-select__option-description">
                          {option.description}
                        </span>
                      ) : null}
                    </>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
