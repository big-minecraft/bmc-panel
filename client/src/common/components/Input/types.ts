import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import type { HTMLMotionProps } from 'framer-motion';
import type { DetailedHTMLProps, InputHTMLAttributes } from 'react';

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
    value?: string | number | readonly string[];  // Updated to match HTML input value types
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    validation?: InputValidation;
    type?: string;
}

export interface UseInputReturn {
    inputProps: {
        name?: string;
        type: string;
        value?: string | number | readonly string[];  // Updated to match HTML input value types
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
        onFocus: () => void;
        onBlur: () => void;
    };
    isFocused: boolean;
    isDirty: boolean;
    error?: string;
    validation: (value: string) => string;
}

interface BaseInputProps {
    label?: ReactNode;
    error?: string;
    success?: boolean;
    icon?: LucideIcon;
    rightIcon?: LucideIcon;
    helper?: string;
    validation?: InputValidation;
    inputClassName?: string;
}

export interface InputProps extends BaseInputProps,
    Omit<DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, 'size'> {
    containerProps?: Omit<HTMLMotionProps<"div">, 'children'>;
}