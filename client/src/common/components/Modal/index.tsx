import React from 'react';
import {useModal} from './hooks/useModal';
import ModalBackdrop from './ModalBackdrop';
import ModalContent from './ModalContent';
import {ModalProps} from './types';

const Modal = React.forwardRef<HTMLDivElement, ModalProps>(({
    id,
    title,
    children,
    footer,
    onClose,
    onConfirm,
    showClose = true,
    size = 'md',
    preventBackdropClose = false,
    closeOnEsc = true,
    className = '',
    ...props
}, ref) => {
    const {
        isOpen,
        isTopModal,
        modalRef,
        handleBackdropClick
    } = useModal({
        id,
        onClose,
        onConfirm,
        preventBackdropClose,
        closeOnEsc,
    });

    if (!isOpen) return null;

    return (
        <ModalBackdrop onClick={handleBackdropClick}>
            <ModalContent
                ref={modalRef}
                title={title}
                footer={footer}
                onClose={onClose}
                showClose={showClose}
                size={size}
                className={className}
                isTopModal={isTopModal}
            >
                {children}
            </ModalContent>
        </ModalBackdrop>
    );
});

Modal.displayName = 'Modal';

export default Modal;