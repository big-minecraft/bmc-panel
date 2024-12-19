import { ReactNode } from 'react';
import { HTMLMotionProps } from 'framer-motion';

export interface SelectOption {
    value: string | number;
    label: string;
}

export interface UseSelectProps {
    name?: string;
    options?: SelectOption[];
    value?: string | number | (string | number)[];
    onChange?: (value: string | number | (string | number)[]) => void;
    multiple?: boolean;
    searchable?: boolean;
    validation?: {
        required?: boolean;
        custom?: (value: any) => string;
    };
}

export interface UseSelectReturn {
    isOpen: boolean;
    searchQuery: string;
    filteredOptions: SelectOption[];
    selectedOption: SelectOption | SelectOption[] | null;
    highlightedIndex: number;
    containerRef: React.RefObject<HTMLDivElement>;
    listRef: React.RefObject<HTMLDivElement>;
    error?: string;
    setIsOpen: (isOpen: boolean) => void;
    setSearchQuery: (query: string) => void;
    setHighlightedIndex: (index: number) => void;
    handleSelect: (option: SelectOption) => void;
    handleKeyDown: (e: React.KeyboardEvent) => void;
}

export interface SelectProps extends Omit<HTMLMotionProps<"div">, 'onChange' | 'value'> {
    options?: SelectOption[];
    value?: string | number | (string | number)[];
    onChange?: (value: string | number | (string | number)[]) => void;
    placeholder?: string;
    label?: ReactNode;
    error?: string;
    disabled?: boolean;
    required?: boolean;
    clearable?: boolean;
    searchable?: boolean;
    multiple?: boolean;
    validation?: {
        required?: boolean;
        custom?: (value: any) => string;
    };
    name?: string;
}

export interface SelectMenuProps {
    isOpen: boolean;
    options: SelectOption[];
    value?: string | number | (string | number)[];
    multiple?: boolean;
    highlightedIndex: number;
    listRef: React.RefObject<HTMLDivElement>;
    onSelect: (option: SelectOption) => void;
    setHighlightedIndex: (index: number) => void;
}