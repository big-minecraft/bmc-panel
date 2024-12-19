import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { HTMLMotionProps } from 'framer-motion';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends Omit<HTMLMotionProps<"span">, "children"> {
    children: ReactNode;
    variant?: BadgeVariant;
    size?: BadgeSize;
    dot?: boolean;
    icon?: LucideIcon;
}

export type BadgeVariantStyles = {
    [key in BadgeVariant]: string;
};

export type BadgeSizeStyles = {
    [key in BadgeSize]: string;
};