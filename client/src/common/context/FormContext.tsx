import React, { createContext, useContext, useCallback, useReducer } from 'react';

const FormContext = createContext(null);

const formReducer = (state, action) => {
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
        case 'UNREGISTER_FIELD':
            const { [action.payload]: _, ...remainingFields } = state.fields;
            return {
                ...state,
                fields: remainingFields
            };
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

export const FormProvider = ({ children, onSubmit, initialValues = {} }) => {
    const [state, dispatch] = useReducer(formReducer, {
        fields: {},
        errors: {}
    });

    const registerField = useCallback((name, value = '', error = '') => {
        dispatch({
            type: 'REGISTER_FIELD',
            payload: { name, value, error }
        });
    }, []);

    const unregisterField = useCallback((name) => {
        dispatch({
            type: 'UNREGISTER_FIELD',
            payload: name
        });
    }, []);

    const setFieldValue = useCallback((name, value, error = '') => {
        dispatch({
            type: 'SET_FIELD_VALUE',
            payload: { name, value, error }
        });
    }, []);

    const getFieldError = useCallback((name) => {
        return state.fields[name]?.error || '';
    }, [state.fields]);

    const handleSubmit = useCallback((e) => {
        e.preventDefault();

        const values = Object.entries(state.fields).reduce((acc, [key, field]) => {
            acc[key] = field.value;
            return acc;
        }, {});

        const errors = Object.entries(state.fields).reduce((acc, [key, field]) => {
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

    const value = {
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

export const useFormContext = () => {
    const context = useContext(FormContext);
    if (!context) {
        return {};
    }
    return context;
};