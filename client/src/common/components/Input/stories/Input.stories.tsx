import type { Meta, StoryObj } from '@storybook/react';
import { Search, Mail, Eye, EyeOff, Lock } from 'lucide-react';
import Input from '../index';

const meta = {
    title: 'Components/Input',
    component: Input,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        type: {
            control: 'select',
            options: ['text', 'password', 'email', 'number', 'tel'],
        },
    },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof Input>;

export const Basic: Story = {
    args: {
        placeholder: 'Enter text',
        className: 'w-80'
    }
};

export const WithLabel: Story = {
    args: {
        label: 'Email Address',
        placeholder: 'Enter your email',
        type: 'email',
        className: 'w-80'
    }
};

export const Required: Story = {
    args: {
        label: 'Username',
        placeholder: 'Enter username',
        required: true,
        className: 'w-80'
    }
};

export const WithIcon: Story = {
    args: {
        label: 'Search',
        placeholder: 'Search...',
        icon: Search,
        className: 'w-80'
    }
};

export const WithRightIcon: Story = {
    args: {
        label: 'Password',
        type: 'password',
        placeholder: 'Enter password',
        icon: Lock,
        rightIcon: Eye,
        className: 'w-80'
    }
};

export const WithHelper: Story = {
    args: {
        label: 'Username',
        placeholder: 'Enter username',
        helper: 'Username must be at least 3 characters',
        className: 'w-80'
    }
};

export const WithError: Story = {
    args: {
        label: 'Email',
        placeholder: 'Enter email',
        type: 'email',
        error: 'Please enter a valid email address',
        className: 'w-80',
        value: 'invalid-email'
    }
};

export const WithSuccess: Story = {
    args: {
        label: 'Email',
        placeholder: 'Enter email',
        type: 'email',
        success: true,
        className: 'w-80',
        value: 'valid@email.com'
    }
};

export const Disabled: Story = {
    args: {
        label: 'Disabled Input',
        placeholder: 'This input is disabled',
        disabled: true,
        className: 'w-80'
    }
};

export const WithValidation: Story = {
    args: {
        label: 'Password',
        type: 'password',
        placeholder: 'Enter password',
        icon: Lock,
        className: 'w-80',
        validation: {
            required: true,
            minLength: 8,
            pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/,
            message: 'Password must be at least 8 characters and contain both letters and numbers'
        }
    }
};

export const EmailWithValidation: Story = {
    args: {
        label: 'Email Address',
        type: 'email',
        placeholder: 'Enter email',
        icon: Mail,
        className: 'w-80',
        validation: {
            required: true,
            pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Please enter a valid email address'
        }
    }
};

const customValidation = (value: string) => {
    if (!value.includes('@company.com')) {
        return 'Email must be a company email address';
    }
    return undefined;
};

export const CustomValidation: Story = {
    args: {
        label: 'Company Email',
        type: 'email',
        placeholder: 'Enter company email',
        icon: Mail,
        className: 'w-80',
        validation: {
            required: true,
            custom: customValidation,
            message: 'Must be a valid company email'
        }
    }
};