import type {Decorator} from '@storybook/react';

interface ThemeDecoratorOptions {
    docsHeight?: string;
    viewportHeight?: string;
}

export const createThemeDecorator = ({
    docsHeight = '168px',
    viewportHeight = '100vh',
}: ThemeDecoratorOptions = {}): Decorator => {
    return (Story, context) => {
        const isInDocs = context.viewMode === 'docs';

        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: isInDocs ? docsHeight : viewportHeight,
                    backgroundColor: 'var(--color-background)',
                }}
            >
                <Story/>
            </div>
        );
    };
};