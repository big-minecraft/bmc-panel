import React from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {Check} from 'lucide-react';
import {SelectMenuProps, SelectOption} from './types';

const SelectMenu = React.forwardRef<HTMLDivElement, SelectMenuProps>(({
    isOpen,
    options,
    value,
    multiple = false,
    highlightedIndex,
    listRef,
    onSelect,
    setHighlightedIndex
}, ref) => {
    if (!isOpen) return null;

    const isSelected = (option: SelectOption): boolean => {
        if (multiple) {
            return Array.isArray(value) && value.includes(option.value);
        }
        return option.value === value;
    };

    return (
        <AnimatePresence>
            <motion.div
                ref={listRef}
                initial={{opacity: 0, y: -10}}
                animate={{opacity: 1, y: 0}}
                exit={{opacity: 0, y: -10}}
                transition={{duration: 0.15}}
                className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 max-h-60 overflow-auto"
                role="listbox"
                id="select-dropdown"
            >
                {options.length === 0 ? (
                    <div className="px-4 py-2 text-sm text-gray-500">
                        No options available
                    </div>
                ) : (
                    options.map((option, index) => (
                        <motion.div
                            key={option.value}
                            whileHover={{backgroundColor: 'rgba(0,0,0,0.025)'}}
                            whileTap={{backgroundColor: 'rgba(0,0,0,0.05)'}}
                            onClick={() => onSelect(option)}
                            onMouseEnter={() => setHighlightedIndex(index)}
                            className={`
                flex items-center px-4 py-2 text-sm cursor-pointer
                ${isSelected(option) ? 'text-indigo-600 bg-indigo-50' : 'text-gray-900'}
                ${highlightedIndex === index ? 'bg-gray-50' : ''}
              `}
                            role="option"
                            aria-selected={isSelected(option)}
                        >
                            {multiple && (
                                <div className={`
                  w-4 h-4 mr-2 border rounded
                  flex items-center justify-center
                  ${isSelected(option) ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'}
                `}>
                                    {isSelected(option) && <Check size={12} className="text-white"/>}
                                </div>
                            )}
                            <span>{option.label}</span>
                            {!multiple && isSelected(option) && (
                                <Check size={16} className="ml-auto text-indigo-600"/>
                            )}
                        </motion.div>
                    ))
                )}
            </motion.div>
        </AnimatePresence>
    );
});

SelectMenu.displayName = 'SelectMenu';

export default SelectMenu;