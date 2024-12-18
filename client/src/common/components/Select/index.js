import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, X, Search } from 'lucide-react';
import { useSelect } from './hooks/useSelect';
import { useTheme } from '../../context/ThemeContext';
import SelectMenu from './SelectMenu';

const Select = ({
                    options = [],
                    value,
                    onChange,
                    placeholder = 'Select option',
                    label,
                    error,
                    disabled = false,
                    required = false,
                    clearable = false,
                    searchable = false,
                    multiple = false,
                    className = '',
                    validation = {},
                    name,
                }) => {
    const theme = useTheme();
    const {
        isOpen,
        searchQuery,
        filteredOptions,
        selectedOption,
        highlightedIndex,
        containerRef,
        listRef,
        setIsOpen,
        setSearchQuery,
        setHighlightedIndex,
        handleSelect,
        handleKeyDown,
        error: validationError
    } = useSelect({
        options,
        value,
        onChange,
        multiple,
        searchable,
        validation,
        name
    });

    const displayError = error || validationError;

    return (
        <div className={className} ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <div className="relative">
                <motion.div
                    whileTap={!disabled ? { scale: 0.995 } : {}}
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    onKeyDown={handleKeyDown}
                    tabIndex={0}
                    role="combobox"
                    aria-expanded={isOpen}
                    aria-controls="select-dropdown"
                    aria-haspopup="listbox"
                    className={`
            relative w-full px-4 py-2 
            bg-white border rounded-lg
            cursor-pointer select-none
            ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}
            ${displayError ? 'border-red-300' : 'border-gray-300'}
            ${isOpen ? 'ring-2 ring-indigo-200 border-indigo-500' : ''}
          `}
                >
                    {searchable && isOpen ? (
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-transparent border-none p-0 focus:outline-none"
                            placeholder="Type to search..."
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                        />
                    ) : (
                        <span className={`block truncate ${!value ? 'text-gray-500' : 'text-gray-900'}`}>
              {multiple
                  ? selectedOption.length
                      ? selectedOption.map(opt => opt.label).join(', ')
                      : placeholder
                  : selectedOption?.label || placeholder
              }
            </span>
                    )}

                    <span className="absolute inset-y-0 right-0 flex items-center pr-4">
            {clearable && value && !disabled && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onChange(multiple ? [] : null);
                    }}
                    className="p-1 hover:bg-gray-100 rounded-full mr-2"
                >
                    <X size={14} className="text-gray-400" />
                </button>
            )}
                        <ChevronDown
                            size={18}
                            className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        />
          </span>
                </motion.div>

                <SelectMenu
                    isOpen={isOpen}
                    options={filteredOptions}
                    value={value}
                    multiple={multiple}
                    highlightedIndex={highlightedIndex}
                    listRef={listRef}
                    onSelect={handleSelect}
                    setHighlightedIndex={setHighlightedIndex}
                />
            </div>

            {displayError && (
                <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1 text-sm text-red-500"
                >
                    {displayError}
                </motion.p>
            )}
        </div>
    );
};

export default Select;