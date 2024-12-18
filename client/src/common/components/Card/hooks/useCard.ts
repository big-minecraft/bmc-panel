import { useState, useCallback } from 'react';
import { useTheme } from '../../../context/ThemeContext';

export const useCard = ({
                            collapsible = false,
                            defaultCollapsed = false,
                            onCollapse,
                            onExpand,
                            loading = false
                        }) => {
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
    const [isHovered, setIsHovered] = useState(false);
    const theme = useTheme();

    const toggleCollapse = useCallback(() => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        if (newState) {
            onCollapse?.();
        } else {
            onExpand?.();
        }
    }, [isCollapsed, onCollapse, onExpand]);

    const handleMouseEnter = useCallback(() => {
        setIsHovered(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false);
    }, []);

    return {
        isCollapsed,
        isHovered,
        loading,
        canCollapse: collapsible,
        toggleCollapse,
        handleMouseEnter,
        handleMouseLeave
    };
};