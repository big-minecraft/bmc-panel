import type { Meta, StoryObj } from '@storybook/react';
import { AlertCircle, Bell, CheckCircle, InfoIcon } from 'lucide-react';
import Badge from '../index';
import type { BadgeProps } from '../types';

const meta = {
    title: 'Components/Badge',
    component: Badge,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <div className="flex gap-4 flex-wrap p-4">
                <Story />
            </div>
        )
    ]
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof Badge>;

// Basic examples with args
export const Default: Story = {
    args: {
        children: 'Default Badge',
        variant: 'default',
        size: 'md'
    }
};

export const Primary: Story = {
    args: {
        children: 'Primary Badge',
        variant: 'primary',
        size: 'md'
    }
};

// Examples with render function
export const AllVariants: Story = {
    args: {} as BadgeProps,
    render: () => (
        <>
            <Badge variant="default">Default</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="danger">Danger</Badge>
            <Badge variant="info">Info</Badge>
        </>
    )
};

export const WithDots: Story = {
    args: {} as BadgeProps,
    render: () => (
        <>
            <Badge variant="default" dot>Default</Badge>
            <Badge variant="primary" dot>Primary</Badge>
            <Badge variant="success" dot>Success</Badge>
            <Badge variant="warning" dot>Warning</Badge>
            <Badge variant="danger" dot>Danger</Badge>
            <Badge variant="info" dot>Info</Badge>
        </>
    )
};

export const WithIcons: Story = {
    args: {} as BadgeProps,
    render: () => (
        <>
            <Badge variant="default" icon={Bell}>Default</Badge>
            <Badge variant="primary" icon={InfoIcon}>Primary</Badge>
            <Badge variant="success" icon={CheckCircle}>Success</Badge>
            <Badge variant="danger" icon={AlertCircle}>Danger</Badge>
        </>
    )
};

export const Sizes: Story = {
    args: {} as BadgeProps,
    render: () => (
        <>
            <Badge variant="primary" size="sm">Small</Badge>
            <Badge variant="primary" size="md">Medium</Badge>
            <Badge variant="primary" size="lg">Large</Badge>
        </>
    )
};

export const WithDotsAndIcons: Story = {
    args: {} as BadgeProps,
    render: () => (
        <>
            <Badge variant="success" dot icon={CheckCircle}>Task Complete</Badge>
            <Badge variant="danger" dot icon={AlertCircle}>Critical Alert</Badge>
            <Badge variant="info" dot icon={Bell}>New Messages</Badge>
        </>
    )
};

// Specific use cases with args
export const NotificationBadge: Story = {
    args: {
        children: '3 New Messages',
        variant: 'primary',
        size: 'sm',
        icon: Bell,
        dot: true
    }
};

export const StatusBadge: Story = {
    args: {
        children: 'Active',
        variant: 'success',
        size: 'sm',
        dot: true
    }
};

export const AlertBadge: Story = {
    args: {
        children: 'Warning',
        variant: 'warning',
        icon: AlertCircle,
        size: 'md'
    }
};