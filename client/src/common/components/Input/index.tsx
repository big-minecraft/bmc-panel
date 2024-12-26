import React from 'react';
import {motion} from 'framer-motion';
import {AlertCircle, CheckCircle2} from 'lucide-react';
import type {InputProps} from './types';
import {useInput} from './hooks/useInput';
import {useTheme} from '../../context/theme/ThemeContext';

const Input = React.forwardRef<HTMLInputElement, InputProps>(({
    label,
    error,
    success,
    icon: Icon,
    rightIcon: RightIcon,
    className = '',
    inputClassName = '',
    disabled = false,
    required = false,
    helper,
    validation,
    name,
    value,
    onChange,
    type = 'text',
    containerProps = {},
    ...props
}, ref) => {
    const theme = useTheme();
    const {
        inputProps,
        isFocused,
        isDirty,
        error: validationError
    } = useInput({
        name,
        value,
        onChange,
        validation,
        type
    });

    const displayError = error || validationError;

    const renderIcon = (IconComponent?: React.FC<any>, position: 'left' | 'right' = 'left') => {
        if (!IconComponent) return null;

        return (
            <div className={`absolute ${position === 'left' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2`}>
                <IconComponent className="w-5 h-5 text-gray-400"/>
            </div>
        );
    };

    return (
        <motion.div
            initial={{opacity: 0, y: -10}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -10}}
            className={className}
            {...containerProps}
        >
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <div className="relative">
                {renderIcon(Icon, 'left')}
                <input
                    ref={ref}
                    {...inputProps}
                    disabled={disabled}
                    className={`
                        w-full px-4 py-2
                        bg-white border rounded-lg
                        text-gray-900 text-sm
                        placeholder:text-gray-400
                        transition-colors duration-200
                        disabled:bg-gray-50 disabled:text-gray-500
                        ${Icon ? 'pl-10' : ''}
                        ${RightIcon || displayError || success ? 'pr-10' : ''}
                        ${displayError ? 'border-red-300 focus:border-red-500 focus:ring-red-200' :
                        success ? 'border-green-300 focus:border-green-500 focus:ring-green-200' :
                            'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200'}
                        focus:outline-none focus:ring-2
                        ${inputClassName}
                    `}
                    {...props}
                />
                {renderIcon(RightIcon, 'right')}
                {displayError && !RightIcon && (
                    <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500"/>
                )}
                {success && !RightIcon && !displayError && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500"/>
                )}
            </div>

            {(displayError || helper) && (
                <motion.p
                    initial={{opacity: 0, y: -5}}
                    animate={{opacity: 1, y: 0}}
                    exit={{opacity: 0, y: -5}}
                    className={`mt-1 text-sm ${displayError ? 'text-red-500' : 'text-gray-500'}`}
                >
                    {displayError || helper}
                </motion.p>
            )}
        </motion.div>
    );
});

Input.displayName = 'Input';

export default Input;