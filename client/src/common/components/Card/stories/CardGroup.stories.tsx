import type {Meta, StoryObj} from '@storybook/react';
import CardGroup from '../CardGroup';
import Card from '../index';

const meta = {
    title: 'Components/Card/CardGroup',
    component: CardGroup,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    args: {
        className: 'w-full max-w-6xl',
        children: null
    }
} satisfies Meta<typeof CardGroup>;

export default meta;
type Story = StoryObj<typeof CardGroup>;

const ExampleCard = ({title}: { title: string }) => (
    <Card header={title}>
        <p>Card content for {title}</p>
    </Card>
);

const defaultCards = (
    <>
        <ExampleCard title="Card 1"/>
        <ExampleCard title="Card 2"/>
        <ExampleCard title="Card 3"/>
        <ExampleCard title="Card 4"/>
    </>
);

export const Basic: Story = {
    args: {
        children: defaultCards
    }
};

export const CustomGap: Story = {
    args: {
        children: defaultCards,
        gap: 8
    }
};

export const CustomColumns: Story = {
    args: {
        children: defaultCards,
        cols: {
            default: 1,
            sm: 2,
            md: 2,
            lg: 3,
            xl: 4
        }
    }
};

export const NonEqualHeight: Story = {
    args: {
        equalHeight: false,
        children: (
            <>
                <ExampleCard title="Short Card"/>
                <Card header="Tall Card">
                    <p>This card has more content</p>
                    <p>Making it taller than others</p>
                    <p>To demonstrate non-equal heights</p>
                </Card>
                <ExampleCard title="Short Card"/>
                <ExampleCard title="Short Card"/>
            </>
        )
    }
};