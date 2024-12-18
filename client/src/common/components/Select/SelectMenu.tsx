import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

const SelectMenu = ({
                        isOpen,
                        options,
                        value,
                        multiple,
                        highlightedIndex,
                        listRef,
                        onSelect,
                        setHighlightedIndex
                    }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 max-h-60 overflow-auto"
                ref={listRef}
                role="listbox"
                id="select-dropdown"
            >
                {options.length === 0 ? (
                    <div className="px-4 py-2 text-sm text-gray-500">
                        No options available
                    </div>
                ) : (
                    options.map((option, index) => {
                        const isSelected = multiple
                            ? value?.includes(option.value)
                            : option.value === value;

                        return (
                            <motion.div
                                key={option.value}
                                whileHover={{ backgroundColor: 'rgba(0,0,0,0.025)' }}
                                whileTap={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
                                onClick={() => onSelect(option)}
                                onMouseEnter={() => setHighlightedIndex(index)}
                                className={`
                  flex items-center px-4 py-2 text-sm cursor-pointer
                  ${isSelected ? 'text-indigo-600 bg-indigo-50' : 'text-gray-900'}
                  ${highlightedIndex === index ? 'bg-gray-50' : ''}
                `}
                                role="option"
                                aria-selected={isSelected}
                            >
                                {multiple && (
                                    <div className={`
                    w-4 h-4 mr-2 border rounded
                    flex items-center justify-center
                    ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'}
                  `}>
                                        {isSelected && <Check size={12} className="text-white" />}
                                    </div>
                                )}
                                <span>{option.label}</span>
                                {!multiple && isSelected && (
                                    <Check size={16} className="ml-auto text-indigo-600" />
                                )}
                            </motion.div>
                        );
                    })
                )}
            </motion.div>
        </AnimatePresence>
    );
};

export default SelectMenu;