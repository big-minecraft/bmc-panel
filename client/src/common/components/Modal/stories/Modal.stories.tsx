import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import Modal from '../index';
import { ModalProvider, useModalContext } from '../context/ModalContext';

const meta = {
    title: 'Components/Modal',
    component: Modal,
    parameters: {
        layout: 'fullscreen',
    },
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '500px',
            }}>
                <ModalProvider>
                    <Story />
                </ModalProvider>
            </div>
        )
    ]
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof Modal>;

const ModalDemo = ({
                       children,
                       buttonText = 'Open Modal',
                       ...props
                   }: { buttonText?: string } & React.ComponentProps<typeof Modal>) => {
    const { registerModal, closeModal } = useModalContext();

    const handleOpen = () => {
        registerModal(props.id);
    };

    const handleClose = () => {
        closeModal(props.id);
        props.onClose?.();
    };

    return (
        <div className="">
            <button
                onClick={handleOpen}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                {buttonText}
            </button>

            <Modal {...props} onClose={handleClose}>
                {children}
            </Modal>
        </div>
    );
};

export const Basic: Story = {
    render: () => (
        <ModalDemo
            id="basic-modal"
            title="Basic Modal"
        >
            <p>This is a basic modal with default settings.</p>
        </ModalDemo>
    )
};

export const WithFooter: Story = {
    render: () => (
        <ModalDemo
            id="footer-modal"
            title="Modal with Footer"
            footer={
                <>
                    <button className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">Cancel</button>
                    <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Save</button>
                </>
            }
        >
            <p>This modal includes footer buttons for actions.</p>
        </ModalDemo>
    )
};

export const Sizes: Story = {
    render: () => (
        <div className="flex gap-4 items-start">
            {(['sm', 'md', 'lg', 'xl', 'full'] as const).map((size) => (
                <ModalDemo
                    key={size}
                    id={`size-modal-${size}`}
                    title={`${size.toUpperCase()} Modal`}
                    size={size}
                    buttonText={`${size.toUpperCase()} Modal`}
                >
                    <p>This is a {size.toUpperCase()} sized modal.</p>
                </ModalDemo>
            ))}
        </div>
    )
};