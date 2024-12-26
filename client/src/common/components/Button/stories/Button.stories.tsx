import type {Meta, StoryObj} from '@storybook/react';
import {RefreshCwIcon} from 'lucide-react';

import Button from '../index';

const meta = {
    title: 'Components/Button',
    component: Button,
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