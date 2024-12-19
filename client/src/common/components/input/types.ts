import { ReactNode } from 'react';
import { HTMLMotionProps } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

export interface InputValidation {
    required?: boolean;
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
    message?: string;
    custom?: (value: string) => string | undefined;
}

export interface UseInputProps {
    name?: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    validation?: InputValidation;
    type?: string;
}

export interface UseInputReturn {
    inputProps: {
        name?: string;
        type: string;
        value?: string;
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
        onFocus: () => void;
        onBlur: () => void;
    };
    isFocused: boolean;
    isDirty: boolean;
    error?: string;
    validation: (value: string) => string;
}

export interface InputProps extends Omit<HTMLMotionProps<"input">, 'size'> {
    label?: ReactNode;
    error?: string;
    success?: boolean;
    icon?: LucideIcon;
    rightIcon?: LucideIcon;
    helper?: string;
    validation?: InputValidation;
    required?: boolean;
    name?: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}