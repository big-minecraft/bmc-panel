import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { HTMLMotionProps } from 'framer-motion';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type IconPosition = 'left' | 'right';

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, 'size'> {
    children: ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: LucideIcon;
    iconPosition?: IconPosition;
    loading?: boolean;
    fullWidth?: boolean;
}

export interface UseButtonProps {
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    variant?: ButtonVariant;
    size?: ButtonSize;
}

export type ButtonVariantClasses = {
    [key in ButtonVariant]: string;
};

export type ButtonSizeClasses = {
    [key in ButtonSize]: string;
};