import type {Meta, StoryObj} from '@storybook/react';
import {LoadingSkeleton} from '../index';

const meta = {
    title: 'Components/Loading/Skeleton',
    component: LoadingSkeleton,
    parameters: {
        docsHeight: '500px'
    }
} satisfies Meta<typeof LoadingSkeleton>;

export default meta;
type Story = StoryObj<typeof LoadingSkeleton>;

export const Basic: Story = {
    args: {
        className: 'w-[400px]'
    }
};

export const NoAvatar: Story = {
    args: {
        avatar: false,
        className: 'w-[400px]'
    }
};

export const SingleRow: Story = {
    args: {
        rows: 1,
        className: 'w-[400px]'
    }
};

export const Dense: Story = {
    args: {
        rows: 3,
        className: 'w-[400px] space-y-2'
    }
};