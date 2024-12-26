import type { Meta, StoryObj } from '@storybook/react';
import { AlertCircle, Bell, CheckCircle, InfoIcon } from 'lucide-react';

import Badge from '../index';
import type { BadgeProps } from '../types';

const meta = {
    title: 'Components/Badge',
    component: Badge,
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllVariants1: Story = {
    args: {} as BadgeProps,
    render: () => (
        <div className="flex gap-4 flex-wrap">
            <Badge variant="default">Default</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="danger">Danger</Badge>
            <Badge variant="info">Info</Badge>
        </div>
    )
};

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

export const AllVariants: Story = {
    args: {} as BadgeProps,
    render: () => (
        <div className="flex gap-4 flex-wrap">
            <Badge variant="default">Default</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="danger">Danger</Badge>
            <Badge variant="info">Info</Badge>
        </div>
    )
};

export const WithDots: Story = {
    args: {} as BadgeProps,
    render: () => (
        <div className="flex gap-4 flex-wrap">
            <Badge variant="default" dot>Default</Badge>
            <Badge variant="primary" dot>Primary</Badge>
            <Badge variant="success" dot>Success</Badge>
            <Badge variant="warning" dot>Warning</Badge>
            <Badge variant="danger" dot>Danger</Badge>
            <Badge variant="info" dot>Info</Badge>
        </div>
    )
};

export const WithIcons: Story = {
    args: {} as BadgeProps,
    render: () => (
        <div className="flex gap-4 flex-wrap">
            <Badge variant="default" icon={Bell}>Default</Badge>
            <Badge variant="primary" icon={InfoIcon}>Primary</Badge>
            <Badge variant="success" icon={CheckCircle}>Success</Badge>
            <Badge variant="danger" icon={AlertCircle}>Danger</Badge>
        </div>
    )
};

export const Sizes: Story = {
    args: {} as BadgeProps,
    render: () => (
        <div className="flex gap-4 flex-wrap">
            <Badge variant="primary" size="sm">Small</Badge>
            <Badge variant="primary" size="md">Medium</Badge>
            <Badge variant="primary" size="lg">Large</Badge>
        </div>
    )
};

export const WithDotsAndIcons: Story = {
    args: {} as BadgeProps,
    render: () => (
        <div className="flex gap-4 flex-wrap">
            <Badge variant="success" dot icon={CheckCircle}>Task Complete</Badge>
            <Badge variant="danger" dot icon={AlertCircle}>Critical Alert</Badge>
            <Badge variant="info" dot icon={Bell}>New Messages</Badge>
        </div>
    )
};

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