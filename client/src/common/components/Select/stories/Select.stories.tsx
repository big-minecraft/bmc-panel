import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import Select from '../index';
import type { SelectOption } from '../types';

const meta = {
    title: 'Components/Select',
    component: Select,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                height: '300px',
            }}>
                <Story />
            </div>
        )
    ]
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof Select>;

const options: SelectOption[] = [
    { value: 'react', label: 'React' },
    { value: 'vue', label: 'Vue' },
    { value: 'angular', label: 'Angular' },
    { value: 'svelte', label: 'Svelte' },
    { value: 'next', label: 'Next.js' },
    { value: 'nuxt', label: 'Nuxt.js' },
    { value: 'remix', label: 'Remix' },
    { value: 'gatsby', label: 'Gatsby' },
];

const manyOptions: SelectOption[] = Array.from({ length: 50 }, (_, i) => ({
    value: `option-${i}`,
    label: `Option ${i + 1}`
}));

// Wrapper component to handle state
const SelectDemo = (props: React.ComponentProps<typeof Select>) => {
    const [value, setValue] = useState<any>(props.multiple ? [] : '');
    return (
        <Select
            {...props}
            value={value}
            onChange={setValue}
            className="w-72"
        />
    );
};

export const Basic: Story = {
    render: () => (
        <SelectDemo
            options={options}
            placeholder="Select a framework"
        />
    )
};

export const WithLabel: Story = {
    render: () => (
        <SelectDemo
            label="Framework"
            options={options}
            placeholder="Select a framework"
        />
    )
};

export const Required: Story = {
    render: () => (
        <SelectDemo
            label="Framework"
            options={options}
            placeholder="Select a framework"
            required
            validation={{ required: true }}
        />
    )
};

export const WithError: Story = {
    render: () => (
        <SelectDemo
            label="Framework"
            options={options}
            placeholder="Select a framework"
            error="Please select a framework"
        />
    )
};

export const Disabled: Story = {
    render: () => (
        <SelectDemo
            label="Framework"
            options={options}
            placeholder="Select a framework"
            disabled
        />
    )
};

export const Searchable: Story = {
    render: () => (
        <SelectDemo
            label="Framework"
            options={manyOptions}
            placeholder="Search and select an option"
            searchable
        />
    )
};

export const Clearable: Story = {
    render: () => (
        <SelectDemo
            label="Framework"
            options={options}
            placeholder="Select a framework"
            clearable
        />
    )
};

export const Multiple: Story = {
    render: () => (
        <SelectDemo
            label="Frameworks"
            options={options}
            placeholder="Select frameworks"
            multiple
        />
    )
};

export const MultipleSearchable: Story = {
    render: () => (
        <SelectDemo
            label="Frameworks"
            options={options}
            placeholder="Search and select frameworks"
            multiple
            searchable
            clearable
        />
    )
};

export const CustomValidation: Story = {
    render: () => (
        <SelectDemo
            label="Framework"
            options={options}
            placeholder="Select a framework"
            validation={{
                required: true,
                custom: (value: string) => {
                    return value === 'angular' ? "Sorry, we don't use Angular here" : '';
                }
            }}
        />
    )
};