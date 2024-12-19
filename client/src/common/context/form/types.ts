export type FormField = {
    value: unknown;
    error: string;
};

export type FormFields = {
    [key: string]: FormField;
};

export type FormErrors = {
    [key: string]: string;
};

export type FormContextValue = {
    fields: FormFields;
    errors: FormErrors;
    registerField: (name: string, value?: unknown, error?: string) => void;
    unregisterField: (name: string) => void;
    setFieldValue: (name: string, value: unknown, error?: string) => void;
    getFieldError: (name: string) => string;
    handleSubmit: (e: React.FormEvent) => void;
};