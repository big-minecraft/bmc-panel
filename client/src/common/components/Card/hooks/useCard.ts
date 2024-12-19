import { useState, useCallback } from 'react';
import { UseCardProps, UseCardReturn } from '../types';

export const useCard = ({
                            collapsible = false,
                            defaultCollapsed = false,
                            onCollapse,
                            onExpand,
                            loading = false
                        }: UseCardProps): UseCardReturn => {
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

    const toggleCollapse = useCallback(() => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        if (newState) {
            onCollapse?.();
        } else {
            onExpand?.();
        }
    }, [isCollapsed, onCollapse, onExpand]);

    return {
        isCollapsed,
        loading,
        toggleCollapse
    };
};