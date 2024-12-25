import type {Meta, StoryObj} from '@storybook/react';
import {useEffect} from 'react';
import ToastContainer from '../index';
import {ToastProvider, useToastContext} from '../context/ToastContext';

const meta = {
    title: 'Components/Toast',
    component: ToastContainer,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <ToastProvider>
                <ToastContainer toasts={[]} onDismiss={() => {
                }}/>
                <Story/>
            </ToastProvider>
        )
    ]
} satisfies Meta<typeof ToastContainer>;

export default meta;
type Story = StoryObj<typeof ToastContainer>;

const ToastDemo = ({
    type = 'success',
    message = 'This is a toast message',
    title,
    autoTrigger = false,
    showButtons = false
}: {
    type?: 'success' | 'error' | 'warning' | 'info';
    message?: string;
    title?: string;
    autoTrigger?: boolean;
    showButtons?: boolean;
}) => {
    const {success, error, warning, info, clearToasts} = useToastContext();

    useEffect(() => {
        if (autoTrigger) {
            switch (type) {
                case 'success':
                    success(message, title);
                    break;
                case 'error':
                    error(message, title);
                    break;
                case 'warning':
                    warning(message, title);
                    break;
                case 'info':
                    info(message, title);
                    break;
            }
        }
    }, [autoTrigger, type, message, title, success, error, warning, info]);

    if (!showButtons) {
        return null;
    }

    return (
        <div className="fixed left-4 top-1/2 -translate-y-1/2">
            <div className="flex flex-col gap-4 w-48">
                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => success('Operation completed successfully', 'Success')}
                        className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                        Show Success
                    </button>
                    <button
                        onClick={() => error('An error occurred', 'Error')}
                        className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                        Show Error
                    </button>
                    <button
                        onClick={() => warning('Please review your input', 'Warning')}
                        className="w-full px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                    >
                        Show Warning
                    </button>
                    <button
                        onClick={() => info('New features are available', 'Info')}
                        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Show Info
                    </button>
                    <button
                        onClick={clearToasts}
                        className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                        Clear All
                    </button>
                </div>
            </div>
        </div>
    );
};

export const AllTypes: Story = {
    render: () => <ToastDemo showButtons={true}/>,
    parameters: {
        layout: 'fullscreen',
        docs: {
            story: {
                height: '500px'
            }
        }
    }
};