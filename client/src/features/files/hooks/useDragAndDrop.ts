import { useCallback, useEffect, useRef, useState } from 'react';
import { toUploadItems } from '../utils/fileUtils';

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

        if (Array.from(e.dataTransfer?.types ?? []).includes('Files')) {
            setDragActive(true);
        }
    }, []);

    const handleDragOut = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current--;
        if (dragCounter.current <= 0) {
            dragCounter.current = 0;
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        dragCounter.current = 0;

        const entries = Array.from(e.dataTransfer?.items ?? [])
            .map((item: any) => item.webkitGetAsEntry?.())
            .filter(Boolean);
        const plainFiles = toUploadItems(e.dataTransfer?.files);

        if (entries.length === 0) {
            if (plainFiles.length > 0) onFilesDrop(plainFiles);
            return;
        }

        collectEntries(entries)
            .then(items => {
                if (items.length > 0) onFilesDrop(items);
            })
            .catch(error => {
                console.error('Could not read the dropped items:', error);
                if (plainFiles.length > 0) onFilesDrop(plainFiles);
            });
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

async function collectEntries(entries: any[]) {
    const items: Array<{ file: File; name: string }> = [];
    for (const entry of entries) {
        await walkEntry(entry, '', items);
    }
    return items;
}

function walkEntry(
    entry: any,
    prefix: string,
    items: Array<{ file: File; name: string }>
): Promise<void> {
    const name = prefix ? `${prefix}/${entry.name}` : entry.name;

    if (entry.isFile) {
        return new Promise((resolve, reject) => {
            entry.file((file: File) => {
                items.push({ file, name });
                resolve();
            }, reject);
        });
    }

    const reader = entry.createReader();

    // readEntries hands back a batch at a time and signals the end with an
    // empty one, so it has to be called until it runs dry.
    return new Promise((resolve, reject) => {
        const readBatch = () => reader.readEntries(async (batch: any[]) => {
            if (batch.length === 0) {
                resolve();
                return;
            }

            try {
                for (const child of batch) await walkEntry(child, name, items);
                readBatch();
            } catch (error) {
                reject(error);
            }
        }, reject);

        readBatch();
    });
}

export default useDragAndDrop;
