import type {Meta, StoryObj} from '@storybook/react';
import {LoadingSpinner} from '../index';

const meta = {
    title: 'Components/Loading/Spinner',
    component: LoadingSpinner,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof LoadingSpinner>;

export default meta;
type Story = StoryObj<typeof LoadingSpinner>;

export const Basic: Story = {
    args: {
        className: 'w-[200px]'
    }
};

export const Sizes: Story = {
    render: () => (
        <div className="flex items-end gap-4">
            <LoadingSpinner size="sm" text="Small"/>
            <LoadingSpinner size="md" text="Medium"/>
            <LoadingSpinner size="lg" text="Large"/>
        </div>
    )
};

export const NoText: Story = {
    args: {
        text: '',
        className: 'w-[200px]'
    }
};

export const CustomText: Story = {
    args: {
        text: 'Please wait while we process your request...',
        className: 'w-[200px]'
    }
};

export const FullScreen: Story = {
    args: {
        text: 'Loading Application'
    }
};