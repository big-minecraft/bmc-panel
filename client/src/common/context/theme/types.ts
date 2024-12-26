export type ThemeColorShades = {
    text: string;
    textHover: string;
    background: string;
    backgroundHover: string;
};

export type ThemeColors = {
    primary: {
        first: string;
        second: string;
        third: string;
    };
    accent: ThemeColorShades;
    negativeAccent: ThemeColorShades;
    background: string;
    backgroundOffset: string;
    undetermined: string;
    success: ThemeColorShades;
    warning: ThemeColorShades;
    danger: ThemeColorShades;
    info: ThemeColorShades;
};


export type ThemeConfig = {
    name: ThemeMode;
    colors: ThemeColors;
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

export type ThemeMode = 'light' | 'dark';