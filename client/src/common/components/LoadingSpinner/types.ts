import { ReactNode } from 'react';
import { HTMLMotionProps } from 'framer-motion';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface LoadingSpinnerProps extends HTMLMotionProps<"div"> {
    size?: SpinnerSize;
    text?: string;
    fullScreen?: boolean;
}

export interface LoadingSkeletonProps extends HTMLMotionProps<"div"> {
    rows?: number;
    avatar?: boolean;
}

export interface ErrorAlertProps extends HTMLMotionProps<"div"> {
    message: string;
}

export type SpinnerSizeClasses = {
    [key in SpinnerSize]: string;
};