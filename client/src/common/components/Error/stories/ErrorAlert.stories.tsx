import type {Meta, StoryObj} from '@storybook/react';
import MessageAlert from '../index';

const meta = {
    title: 'Components/MessageAlert',
    component: MessageAlert,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof MessageAlert>;

export default meta;
type Story = StoryObj<typeof MessageAlert>;

export const Success: Story = {
    args: {
        type: 'success',
        message: 'Changes saved successfully!',
        className: 'w-[400px]'
    }
};

export const Error: Story = {
    args: {
        type: 'error',
        message: 'An error occurred while processing your request.',
        className: 'w-[400px]'
    }
};

export const Info: Story = {
    args: {
        type: 'info',
        message: 'Your session will expire in 5 minutes.',
        className: 'w-[400px]'
    }
};

export const Warning: Story = {
    args: {
        type: 'warning',
        message: 'This action cannot be undone.',
        className: 'w-[400px]'
    }
};

export const LongMessage: Story = {
    args: {
        type: 'error',
        message: 'We encountered a problem while trying to save your changes. Please check your internet connection and try again. If the problem persists, please contact support.',
        className: 'w-[400px]'
    }
};

export const AllTypes: Story = {
    render: () => (
        <div className="w-[400px] space-y-4">
            <MessageAlert type="success" message="Operation completed successfully"/>
            <MessageAlert type="error" message="Unable to save changes"/>
            <MessageAlert type="info" message="New updates are available"/>
            <MessageAlert type="warning" message="Your session will expire soon"/>
        </div>
    )
};