import {useState, useRef, useCallback, useEffect} from 'react';

const useDragAndDrop = (onFilesDrop) => {
    const [dragActive, setDragActive] = useState(false);
    const dragCounter = useRef(0);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDragIn = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current++;
        if (e.dataTransfer.items?.length > 0) {
            setDragActive(true);
        }
    }, []);

    const handleDragOut = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current--;
        if (dragCounter.current === 0) {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        dragCounter.current = 0;

        if (e.dataTransfer.files?.length > 0) {
            onFilesDrop(e.dataTransfer.files);
        }
    }, [onFilesDrop]);

    useEffect(() => {
        window.addEventListener('dragenter', handleDragIn);
        window.addEventListener('dragleave', handleDragOut);
        window.addEventListener('dragover', handleDrag);
        window.addEventListener('drop', handleDrop);

        return () => {
            window.removeEventListener('dragenter', handleDragIn);
            window.removeEventListener('dragleave', handleDragOut);
            window.removeEventListener('dragover', handleDrag);
            window.removeEventListener('drop', handleDrop);
        };
    }, [handleDragIn, handleDragOut, handleDrag, handleDrop]);

    return dragActive;
};

export default useDragAndDrop;
