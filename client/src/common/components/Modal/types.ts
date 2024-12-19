import { ReactNode } from 'react';
import { HTMLMotionProps } from 'framer-motion';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalContextValue {
    openModals: string[];
    registerModal: (id: string) => void;
    unregisterModal: (id: string) => void;
    closeModal: (id: string) => void;
    closeAllModals: () => void;
}

export interface UseModalProps {
    id: string;
    onClose?: () => void;
    onConfirm?: () => void;
    preventBackdropClose?: boolean;
    closeOnEsc?: boolean;
    trapFocus?: boolean;
}

export interface UseModalReturn {
    isOpen: boolean;
    isTopModal: boolean;
    modalRef: React.RefObject<HTMLDivElement>;
    handleBackdropClick: (e: React.MouseEvent) => void;
}

export interface ModalBackdropProps extends HTMLMotionProps<"div"> {
    children: ReactNode;
    onClick: (e: React.MouseEvent) => void;
}

export interface ModalContentProps extends HTMLMotionProps<"div"> {
    title?: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
    onClose?: () => void;
    showClose?: boolean;
    size?: ModalSize;
    isTopModal: boolean;
}

export interface ModalProps extends Omit<HTMLMotionProps<"div">, 'title'> {
    id: string;
    title?: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
    onClose?: () => void;
    onConfirm?: () => void;
    showClose?: boolean;
    size?: ModalSize;
    preventBackdropClose?: boolean;
    closeOnEsc?: boolean;
}