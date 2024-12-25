import type {Meta, StoryObj} from '@storybook/react';
import {CardHeader, CardBody, CardFooter} from '../CardParts';

const meta = {
    title: 'Components/Card/Parts',
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof CardHeader>;

export default meta;

export const Header: StoryObj<typeof CardHeader> = {
    render: () => (
        <div className="w-96 border rounded-t-xl">
            <CardHeader>Basic Header</CardHeader>
        </div>
    )
};

export const HeaderWithActions: StoryObj<typeof CardHeader> = {
    render: () => (
        <div className="w-96 border rounded-t-xl">
            <CardHeader
                actions={
                    <button className="text-blue-500">Action</button>
                }
            >
                Header with Actions
            </CardHeader>
        </div>
    )
};

export const HeaderNoDivider: StoryObj<typeof CardHeader> = {
    render: () => (
        <div className="w-96 border rounded-t-xl">
            <CardHeader divider={false}>Header without Divider</CardHeader>
        </div>
    )
};

export const Body: StoryObj<typeof CardBody> = {
    render: () => (
        <div className="w-96 border">
            <CardBody>
                <p>This is the card body content</p>
            </CardBody>
        </div>
    )
};

export const BodyNoPadding: StoryObj<typeof CardBody> = {
    render: () => (
        <div className="w-96 border">
            <CardBody padding={false}>
                <img src="/api/placeholder/384/200" alt="placeholder" className="w-full"/>
            </CardBody>
        </div>
    )
};

export const Footer: StoryObj<typeof CardFooter> = {
    render: () => (
        <div className="w-96 border rounded-b-xl">
            <CardFooter>
                <button className="px-4 py-2 bg-blue-500 text-white rounded">Action</button>
            </CardFooter>
        </div>
    )
};

export const FooterLeftAligned: StoryObj<typeof CardFooter> = {
    render: () => (
        <div className="w-96 border rounded-b-xl">
            <CardFooter align="left">
                <button className="px-4 py-2 bg-blue-500 text-white rounded">Left</button>
            </CardFooter>
        </div>
    )
};

export const FooterCentered: StoryObj<typeof CardFooter> = {
    render: () => (
        <div className="w-96 border rounded-b-xl">
            <CardFooter align="center">
                <button className="px-4 py-2 bg-blue-500 text-white rounded">Centered</button>
            </CardFooter>
        </div>
    )
};