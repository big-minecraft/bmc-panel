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
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: isInDocs ? docsHeight : '100vh',
                    backgroundColor: 'var(--color-background)',
                    ...customStyles
                }}
            >
                <Story />
            </div>
        )
    }
}