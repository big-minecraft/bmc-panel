import React from 'react'
import './preview.css'
import {ThemeProvider} from "../src/common/context/ThemeContext";

const withTheme = (Story) => (
    <ThemeProvider>
        <div className="p-4">
            <Story />
        </div>
    </ThemeProvider>
)

const preview = {
    parameters: {
        actions: { argTypesRegex: '^on[A-Z].*' },
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i
            }
        }
    },
    decorators: [withTheme]
}

export default preview