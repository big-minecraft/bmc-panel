export type BaseColor = {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
};

export type BaseColors = {
    indigo: BaseColor;
    gray: BaseColor;
    white: string;
    black: string;
    success: {
        light: string;
        DEFAULT: string;
        dark: string;
    };
    warning: {
        light: string;
        DEFAULT: string;
        dark: string;
    };
    error: {
        light: string;
        DEFAULT: string;
        dark: string;
    };
    info: {
        light: string;
        DEFAULT: string;
        dark: string;
    };
};

export type ThemeColors = {
    primary: string;
    primaryHover: string;
    primaryLight: string;
    secondary: string;
    secondaryHover: string;
    secondaryLight: string;
    background: string;
    backgroundOffset: string;
    text: string;
    textSecondary: string;
    textDisabled: string;
    border: string;
    borderHover: string;
    success: string;
    warning: string;
    error: string;
    info: string;
};

export type Theme = ThemeColors & {
    spacing: {
        xs: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
    };
    borderRadius: {
        sm: string;
        md: string;
        lg: string;
        xl: string;
        full: string;
    };
    animation: {
        bouncy: {
            type: string;
            stiffness: number;
            damping: number;
        };
        smooth: {
            type: string;
            stiffness: number;
            damping: number;
        };
    };
    shadows: {
        sm: string;
        md: string;
        lg: string;
    };
};