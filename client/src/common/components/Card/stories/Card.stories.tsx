import type { Meta, StoryObj } from '@storybook/react';
import { Bell } from 'lucide-react';
import Card from '../index';

const meta = {
    title: 'Components/Card',
    component: Card,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
    args: {
        children: 'This is a basic card with some content.',
        className: 'w-96'
    }
};

export const WithHeaderAndFooter: Story = {
    args: {
        header: 'Card Title',
        children: 'This is a card with a header and footer.',
        footer: <div className="flex gap-2"><button className="px-4 py-2 bg-blue-500 text-white rounded">Save</button></div>,
        className: 'w-96'
    }
};

export const Hoverable: Story = {
    args: {
        header: 'Hoverable Card',
        children: 'This card has a hover effect. Try hovering over it!',
        hoverable: true,
        className: 'w-96'
    }
};

export const Collapsible: Story = {
    args: {
        header: 'Collapsible Card',
        children: 'This content can be collapsed by clicking the header.',
        collapsible: true,
        className: 'w-96'
    }
};

export const Loading: Story = {
    args: {
        header: 'Loading Card',
        children: 'This content will not be visible while loading.',
        loading: true,
        className: 'w-96'
    }
};

export const Borderless: Story = {
    args: {
        header: 'Borderless Card',
        children: 'This card has no border.',
        bordered: false,
        className: 'w-96'
    }
};

export const WithCustomHeader: Story = {
    args: {
        header: (
            <div className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                <span>Notifications</span>
            </div>
        ),
        children: 'This card has a custom header with an icon.',
        className: 'w-96'
    }
};

export const WithComposition: Story = {
    render: () => (
        <Card className="w-96">
            <Card.Header actions={<button className="text-blue-500">View All</button>}>
                Dashboard Overview
            </Card.Header>
            <Card.Body>
                <p>This card uses composition with Card.Header, Card.Body, and Card.Footer.</p>
            </Card.Body>
            <Card.Footer>
                <button className="px-4 py-2 bg-gray-100 rounded">Cancel</button>
                <button className="px-4 py-2 bg-blue-500 text-white rounded">Save</button>
            </Card.Footer>
        </Card>
    )
};