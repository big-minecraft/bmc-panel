import type { Meta, StoryObj } from '@storybook/react';
import { RefreshCwIcon } from 'lucide-react';

import Button from '../index';

const withTheme = (Story, context) => {
    const isInDocs = context.viewMode === 'docs';
    return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: isInDocs ? '168px' : '100vh',
                    backgroundColor: 'var(--color-background)',
                }}
            >
                <Story />
            </div>
    );
};

const meta = {
    title: 'Components/Button',
    component: Button,
    decorators: [withTheme],
    tags: ['autodocs'],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
    args: {
        children: 'Primary Button',
        variant: 'primary',
        size: 'md'
    }
};

export const WithIcon: Story = {
    args: {
        children: 'Refresh Button',
        variant: 'primary',
        size: 'md',
        icon: RefreshCwIcon,
        iconPosition: 'right'
    }
};

export const Loading: Story = {
    args: {
        children: 'Loading Button',
        variant: 'primary',
        size: 'md',
        loading: true
    }
};

export const Disabled: Story = {
    args: {
        children: 'Disabled Button',
        variant: 'primary',
        size: 'md',
        disabled: true
    }
};