import { useState, useCallback } from 'react';
import { useFormContext } from '../../../context/form/FormContext';
import { UseInputProps, UseInputReturn } from '../types';

export const useInput = ({
                             name,
                             value: propValue,
                             onChange: propOnChange,
                             validation = {},
                             type = 'text'
                         }: UseInputProps): UseInputReturn => {
    const [isFocused, setIsFocused] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const { registerField, unregisterField, setFieldValue, getFieldError } = useFormContext();

    const validateValue = useCallback((value: string): string => {
        if (validation.required && !value) {
            return 'This field is required';
        }
        if (validation.pattern && !validation.pattern.test(value)) {
            return validation.message || 'Invalid format';
        }
        if (validation.minLength && value.length < validation.minLength) {
            return `Minimum length is ${validation.minLength}`;
        }
        if (validation.maxLength && value.length > validation.maxLength) {
            return `Maximum length is ${validation.maxLength}`;
        }
        if (validation.custom) {
            return validation.custom(value) || '';
        }
        return '';
    }, [validation]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        if (!isDirty) setIsDirty(true);

        if (propOnChange) {
            propOnChange(e);
        }

        if (setFieldValue && name) {
            setFieldValue(name, newValue, validateValue(newValue));
        }
    }, [isDirty, name, propOnChange, setFieldValue, validateValue]);

    const handleFocus = useCallback(() => {
        setIsFocused(true);
    }, []);

    const handleBlur = useCallback(() => {
        setIsFocused(false);
        if (!isDirty) setIsDirty(true);

        if (setFieldValue && name && propValue !== undefined) {
            const error = validateValue(propValue);
            setFieldValue(name, propValue, error);
        }
    }, [isDirty, name, propValue, setFieldValue, validateValue]);

    return {
        inputProps: {
            name,
            type,
            value: propValue,
            onChange: handleChange,
            onFocus: handleFocus,
            onBlur: handleBlur,
        },
        isFocused,
        isDirty,
        error: name ? getFieldError?.(name) : undefined,
        validation: validateValue,
    };
};