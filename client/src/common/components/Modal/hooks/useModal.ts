import { useCallback, useEffect, useRef } from 'react';
import { useModalContext } from '../context/ModalContext';

export const useModal = ({
                             id,
                             onClose,
                             onConfirm,
                             preventBackdropClose = false,
                             closeOnEsc = true,
                             trapFocus = true
                         }) => {
    const {
        openModals,
        registerModal,
        unregisterModal,
        closeModal
    } = useModalContext();

    const modalRef = useRef(null);
    const previousActiveElement = useRef(null);

    const isOpen = openModals.includes(id);
    const isTopModal = openModals[openModals.length - 1] === id;

    const focusableElements = useCallback(() => {
        if (!modalRef.current) return [];

        return Array.from(modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ));
    }, []);

    const handleKeyDown = useCallback((e) => {
        if (!isTopModal) return;

        if (closeOnEsc && e.key === 'Escape') {
            e.preventDefault();
            onClose?.();
            closeModal(id);
            return;
        }

        if (trapFocus && e.key === 'Tab') {
            const elements = focusableElements();
            if (elements.length === 0) return;

            const firstElement = elements[0];
            const lastElement = elements[elements.length - 1];

            if (e.shiftKey && document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    }, [isTopModal, closeOnEsc, trapFocus, focusableElements, closeModal, id, onClose]);

    const handleBackdropClick = useCallback((e) => {
        if (e.target === e.currentTarget && !preventBackdropClose) {
            onClose?.();
            closeModal(id);
        }
    }, [preventBackdropClose, closeModal, id, onClose]);

    useEffect(() => {
        if (isOpen) {
            previousActiveElement.current = document.activeElement;
            registerModal(id);
            document.addEventListener('keydown', handleKeyDown);

            const firstFocusable = focusableElements()[0];
            if (firstFocusable) {
                firstFocusable.focus();
            }

            document.body.style.overflow = 'hidden';
        }

        return () => {
            if (isOpen) {
                document.removeEventListener('keydown', handleKeyDown);
                previousActiveElement.current?.focus();
                document.body.style.overflow = '';
            }
        };
    }, [isOpen, id, registerModal, handleKeyDown, focusableElements]);

    useEffect(() => {
        return () => unregisterModal(id);
    }, [id, unregisterModal]);

    return {
        isOpen,
        isTopModal,
        modalRef,
        handleBackdropClick
    };
};