import type {HTMLMotionProps} from 'framer-motion';

export type SpinnerSize = 'sm' | 'md' | 'lg';

interface BaseLoadingSpinnerProps {
    size?: SpinnerSize;
    text?: string;
}

interface BaseLoadingSkeletonProps {
    rows?: number;
    avatar?: boolean;
}

export interface LoadingSpinnerProps extends HTMLMotionProps<"div">, BaseLoadingSpinnerProps {
}

export interface LoadingSkeletonProps extends HTMLMotionProps<"div">, BaseLoadingSkeletonProps {
}

export type SpinnerSizeClasses = {
    [key in SpinnerSize]: string;
};