import React, {createContext, useContext, useCallback, useReducer, ReactNode} from 'react';
import {FormContextValue, FormFields, FormErrors} from './types';

type FormState = {
    fields: FormFields;
    errors: FormErrors;
};

type FormAction =
    | { type: 'REGISTER_FIELD'; payload: { name: string; value: unknown; error: string; } }
    | { type: 'UNREGISTER_FIELD'; payload: string }
    | { type: 'SET_FIELD_VALUE'; payload: { name: string; value: unknown; error: string; } }
    | { type: 'SET_FORM_ERRORS'; payload: FormErrors }
    | { type: 'RESET_FORM' };

const FormContext = createContext<FormContextValue | null>(null);

const formReducer = (state: FormState, action: FormAction): FormState => {
    switch (action.type) {
        case 'REGISTER_FIELD':
            return {
                ...state,
                fields: {
                    ...state.fields,
                    [action.payload.name]: {
                        value: action.payload.value,
                        error: action.payload.error,
                    }
                }
            };
        case 'UNREGISTER_FIELD': {
            const {[action.payload]: _, ...remainingFields} = state.fields;
            return {
                ...state,
                fields: remainingFields
            };
        }
        case 'SET_FIELD_VALUE':
            return {
                ...state,
                fields: {
                    ...state.fields,
                    [action.payload.name]: {
                        value: action.payload.value,
                        error: action.payload.error,
                    }
                }
            };
        case 'SET_FORM_ERRORS':
            return {
                ...state,
                errors: action.payload
            };
        case 'RESET_FORM':
            return {
                fields: {},
                errors: {}
            };
        default:
            return state;
    }
};

type FormProviderProps = {
    children: ReactNode;
    onSubmit?: (values: Record<string, unknown>) => void;
    initialValues?: Record<string, unknown>;
};

export const FormProvider: React.FC<FormProviderProps> = ({
    children,
    onSubmit,
    initialValues = {}
}) => {
    const [state, dispatch] = useReducer(formReducer, {
        fields: {},
        errors: {}
    });

    const registerField = useCallback((name: string, value: unknown = '', error: string = '') => {
        dispatch({
            type: 'REGISTER_FIELD',
            payload: {name, value, error}
        });
    }, []);

    const unregisterField = useCallback((name: string) => {
        dispatch({
            type: 'UNREGISTER_FIELD',
            payload: name
        });
    }, []);

    const setFieldValue = useCallback((name: string, value: unknown, error: string = '') => {
        dispatch({
            type: 'SET_FIELD_VALUE',
            payload: {name, value, error}
        });
    }, []);

    const getFieldError = useCallback((name: string): string => {
        return state.fields[name]?.error || '';
    }, [state.fields]);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();

        const values = Object.entries(state.fields).reduce<Record<string, unknown>>((acc, [key, field]) => {
            acc[key] = field.value;
            return acc;
        }, {});

        const errors = Object.entries(state.fields).reduce<Record<string, string>>((acc, [key, field]) => {
            if (field.error) {
                acc[key] = field.error;
            }
            return acc;
        }, {});

        if (Object.keys(errors).length === 0) {
            onSubmit?.(values);
        } else {
            dispatch({
                type: 'SET_FORM_ERRORS',
                payload: errors
            });
        }
    }, [state.fields, onSubmit]);

    const value: FormContextValue = {
        fields: state.fields,
        errors: state.errors,
        registerField,
        unregisterField,
        setFieldValue,
        getFieldError,
        handleSubmit
    };

    return (
        <FormContext.Provider value={value}>
            {children}
        </FormContext.Provider>
    );
};

export const useFormContext = (): Partial<FormContextValue> => {
    const context = useContext(FormContext);
    if (!context) {
        return {};
    }
    return context;
};