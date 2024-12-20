import { useState, useCallback } from 'react';

export interface DatabaseNameValidation {
    isValid: boolean;
    error: string | null;
}

export function useDatabaseName(initialValue: string = ''): {
    name: string;
    validation: DatabaseNameValidation;
    setName: (name: string) => void;
} {
    const [name, setName] = useState(initialValue);
    const [validation, setValidation] = useState<DatabaseNameValidation>({
        isValid: false,
        error: null
    });

    const validateName = useCallback((input: string): DatabaseNameValidation => {
        if (!input.trim()) {
            return { isValid: false, error: null };
        }

        const validNameRegex = /^[a-zA-Z0-9_]+$/;
        const isValid = validNameRegex.test(input);

        return {
            isValid,
            error: isValid ? null : 'Database name can only contain letters, numbers, dashes, and underscores'
        };
    }, []);

    const handleNameChange = useCallback((newName: string) => {
        setName(newName);
        setValidation(validateName(newName));
    }, [validateName]);

    return {
        name,
        validation,
        setName: handleNameChange
    };
}