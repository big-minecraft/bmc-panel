import type { Decorator } from '@storybook/react'

interface ThemeDecoratorOptions {
    defaultDocsHeight: string
}

export const withTheme = ({
    defaultDocsHeight
}: ThemeDecoratorOptions): Decorator => {
    return (Story, context) => {
        const isInDocs = context.viewMode === 'docs'
        const docsHeight = context.parameters.docsHeight || defaultDocsHeight
        const customStyles = context.parameters.styles || {}

        return (
            <div
                className='flex justify-center items-center bg-background dark:bg-background-dark'
                style={{
                    height: isInDocs ? docsHeight : '100vh',
                    ...customStyles
                }}
            >
                <Story />
            </div>
        )
    }
}