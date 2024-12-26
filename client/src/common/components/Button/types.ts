import {ReactNode} from 'react';
import {LucideIcon} from 'lucide-react';
import {HTMLMotionProps} from 'framer-motion';

/** Visual style variants for the button */
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

/** Size variations for the button */
export type ButtonSize = 'sm' | 'md' | 'lg';

/** Position of the icon relative to button text */
export type IconPosition = 'left' | 'right';

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, 'size'> {
    /** Content to be rendered inside the button */
    children: ReactNode;
    /** Visual style variant of the button */
    variant?: ButtonVariant;
    /** Size variant of the button */
    size?: ButtonSize;
    /** Optional icon to display alongside text */
    icon?: LucideIcon;
    /** Position of the icon relative to button text */
    iconPosition?: IconPosition;
    /** Whether the button is in a loading state */
    loading?: boolean;
    /** Whether the button should take up full width of its container */
    fullWidth?: boolean;
}

export interface UseButtonProps {
    /** Whether the button is disabled */
    disabled?: boolean;
    /** Whether the button is in a loading state */
    loading?: boolean;
    /** Whether the button should take up full width of its container */
    fullWidth?: boolean;
    /** Visual style variant of the button */
    variant?: ButtonVariant;
    /** Size variant of the button */
    size?: ButtonSize;
}

export type ButtonVariantClasses = {
    [key in ButtonVariant]: string;
};

export type ButtonSizeClasses = {
    [key in ButtonSize]: string;
};