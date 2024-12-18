import React from 'react';
import {ThemeProvider} from "../src/common/context/ThemeContext";

export const withTheme = (Story) => (
    <ThemeProvider>
        <Story />
    </ThemeProvider>
);