import React from 'react'
import Button from './index'
import { Mail, ArrowRight } from 'lucide-react'

/**
 * @type {import('@storybook/react').Meta}
 */
const meta = {
    title: 'Components/Button',
    component: Button,
    tags: ['autodocs'],
    args: {
        children: 'Button',
        variant: 'primary',
        size: 'md',
        loading: false,
        disabled: false,
        fullWidth: false,
        iconPosition: 'left'
    },
    parameters: {
        componentSubtitle: 'A reusable button component',
    },
    argTypes: {
        children: {
            description: 'Content of the button',
            control: 'text'
        },
        variant: {
            description: 'Style variant of the button',
            options: ['primary', 'secondary', 'outline', 'ghost', 'danger'],
            control: { type: 'select' },
            table: {
                defaultValue: { summary: 'primary' }
            }
        },
        size: {
            description: 'Size of the button',
            options: ['sm', 'md', 'lg'],
            control: { type: 'select' },
            table: {
                defaultValue: { summary: 'md' }
            }
        },
        loading: {
            description: 'Shows a loading spinner',
            control: 'boolean',
            table: {
                defaultValue: { summary: false }
            }
        },
        disabled: {
            description: 'Disables the button',
            control: 'boolean',
            table: {
                defaultValue: { summary: false }
            }
        },
        fullWidth: {
            description: 'Makes the button take full width of its container',
            control: 'boolean',
            table: {
                defaultValue: { summary: false }
            }
        },
        iconPosition: {
            description: 'Position of the icon',
            options: ['left', 'right'],
            control: 'radio',
            table: {
                defaultValue: { summary: 'left' }
            }
        },
        className: {
            description: 'Additional CSS classes',
            control: 'text',
            table: {
                defaultValue: { summary: '' }
            }
        },
        type: {
            description: 'HTML button type',
            options: ['button', 'submit', 'reset'],
            control: { type: 'select' },
            table: {
                defaultValue: { summary: 'button' }
            }
        },
        icon: {
            description: 'Icon to display in the button',
            options: ['none', 'mail', 'arrow'],
            control: { type: 'select' },
            mapping: {
                none: undefined,
                mail: Mail,
                arrow: ArrowRight
            }
        }
    }
}

export default meta

export const Example = {
    render: (args) => <Button {...args} />
}