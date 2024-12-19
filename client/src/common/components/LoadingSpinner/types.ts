import type { HTMLMotionProps } from 'framer-motion';

export type SpinnerSize = 'sm' | 'md' | 'lg';

interface BaseLoadingSpinnerProps {
    size?: SpinnerSize;
    text?: string;
    fullScreen?: boolean;
}

interface BaseLoadingSkeletonProps {
    rows?: number;
    avatar?: boolean;
}

interface BaseErrorAlertProps {
    message: string;
}

export interface LoadingSpinnerProps extends HTMLMotionProps<"div">, BaseLoadingSpinnerProps {}
export interface LoadingSkeletonProps extends HTMLMotionProps<"div">, BaseLoadingSkeletonProps {}
export interface ErrorAlertProps extends HTMLMotionProps<"div">, BaseErrorAlertProps {}

export type SpinnerSizeClasses = {
    [key in SpinnerSize]: string;
};