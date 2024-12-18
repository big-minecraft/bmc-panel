// import React from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { X } from 'lucide-react';
// import { useModal } from './hooks/useModal';
// import { useTheme } from '../../context/ThemeContext';
// import ModalBackdrop from './ModalBackdrop';
// import ModalContent from './ModalContent';
//
// const Modal = ({
//                    id,
//                    title,
//                    children,
//                    footer,
//                    onClose,
//                    onConfirm,
//                    showClose = true,
//                    size = 'md',
//                    preventBackdropClose = false,
//                    closeOnEsc = true,
//                    className = '',
//                }) => {
//     const theme = useTheme();
//     const {
//         isOpen,
//         isTopModal,
//         modalRef,
//         handleBackdropClick
//     } = useModal({
//         id,
//         onClose,
//         onConfirm,
//         preventBackdropClose,
//         closeOnEsc
//     });
//
//     if (!isOpen) return null;
//
//     return (
//         <ModalBackdrop onClick={handleBackdropClick}>
//             <ModalContent
//                 ref={modalRef}
//                 title={title}
//                 footer={footer}
//                 onClose={onClose}
//                 showClose={showClose}
//                 size={size}
//                 className={className}
//                 isTopModal={isTopModal}
//             >
//                 {children}
//             </ModalContent>
//         </ModalBackdrop>
//     );
// };
//
// export default Modal;