import type {Preview} from "@storybook/react";
import {withThemeFromJSXProvider} from '@storybook/addon-themes';
import {ThemeProvider} from '../src/common/context/theme/ThemeContext';
import '../src/index.css';
import {themes} from "../src/common/context/theme/colors";
import {withTheme} from "./withTheme";

const preview: Preview = {
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
        backgrounds: {
            disable: true
        },
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/,
            },
        },
    },
    decorators: [
        withThemeFromJSXProvider({
            themes: {
                light: themes.light,
                dark: themes.dark,
            },
            defaultTheme: 'dark',
            Provider: ({theme, children}) => (
                <ThemeProvider modeOverride={theme.name}>
                    {children}
                </ThemeProvider>
            ),
        }),
        withTheme({
            defaultDocsHeight: '168px'
        })
    ],
};

export default preview;