import {ReactNode} from 'react';
import {HTMLMotionProps} from 'framer-motion';

export interface CardProps extends Omit<HTMLMotionProps<"div">, 'children'> {
    children?: ReactNode;
    hoverable?: boolean;
    bordered?: boolean;
    collapsible?: boolean;
    defaultCollapsed?: boolean;
    onCollapse?: () => void;
    onExpand?: () => void;
    header?: ReactNode;
    footer?: ReactNode;
    loading?: boolean;
    padding?: boolean;
}

export interface CardHeaderProps extends HTMLMotionProps<"div"> {
    children: ReactNode;
    actions?: ReactNode;
    divider?: boolean;
}

export interface CardBodyProps extends HTMLMotionProps<"div"> {
    children: ReactNode;
    padding?: boolean;
}

export interface CardFooterProps extends HTMLMotionProps<"div"> {
    children: ReactNode;
    divider?: boolean;
    align?: 'left' | 'center' | 'right';
}

export interface UseCardProps {
    collapsible?: boolean;
    defaultCollapsed?: boolean;
    onCollapse?: () => void;
    onExpand?: () => void;
    loading?: boolean;
}

export interface UseCardReturn {
    isCollapsed: boolean;
    loading: boolean;
    toggleCollapse: () => void;
}

export interface CardGroupProps extends HTMLMotionProps<"div"> {
    children: ReactNode;
    gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8;
    cols?: {
        default: number;
        sm?: number;
        md?: number;
        lg?: number;
        xl?: number;
    };
    equalHeight?: boolean;
}

export interface CardComponent extends React.ForwardRefExoticComponent<CardProps & React.RefAttributes<HTMLDivElement>> {
    Header: React.ForwardRefExoticComponent<CardHeaderProps & React.RefAttributes<HTMLDivElement>>;
    Body: React.ForwardRefExoticComponent<CardBodyProps & React.RefAttributes<HTMLDivElement>>;
    Footer: React.ForwardRefExoticComponent<CardFooterProps & React.RefAttributes<HTMLDivElement>>;
}