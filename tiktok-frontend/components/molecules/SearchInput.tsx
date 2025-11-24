'use client';

import { Search, X } from 'lucide-react';
import React from 'react';

export interface SearchInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  disabled?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value: controlledValue,
  onChange,
  onSearch,
  placeholder = 'Search...',
  className = '',
  autoFocus = false,
  disabled = false,
}) => {
  const [internalValue, setInternalValue] = React.useState('');
  const [isFocused, setIsFocused] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const setValue = controlledValue !== undefined ? onChange : setInternalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue?.(e.target.value);
  };

  const handleClear = () => {
    setValue?.('');
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSearch?.(value.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div
        className={`
          flex items-center gap-3 px-4 py-2.5
          bg-gray-100 dark:bg-dark-800
          rounded-full transition-all duration-200
          ${isFocused ? 'ring-2 ring-primary-500 bg-white dark:bg-dark-700' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className="flex-1 bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 text-sm"
        />

        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 hover:bg-gray-200 dark:hover:bg-dark-600 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Search Suggestions (can be extended) */}
      {isFocused && value && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-dark-800 rounded-lg shadow-lg border border-gray-200 dark:border-dark-700 overflow-hidden animate-fade-in">
          <div className="p-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 px-3 py-2">
              Press Enter to search
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default SearchInput;
