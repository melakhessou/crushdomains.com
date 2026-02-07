'use client';

import React, { forwardRef } from 'react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import clsx from 'clsx';

export interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    helperText?: string;
    errorMessage?: string;
    validationState?: 'idle' | 'valid' | 'invalid' | 'validating';
    showCleanedValue?: string;
    icon?: React.ReactNode;
}

export const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(
    (
        {
            label,
            helperText,
            errorMessage,
            validationState = 'idle',
            showCleanedValue,
            icon,
            className,
            ...props
        },
        ref
    ) => {
        const isValid = validationState === 'valid';
        const isInvalid = validationState === 'invalid';
        const isValidating = validationState === 'validating';

        return (
            <div className="w-full space-y-2">
                {label && (
                    <label className="block text-sm font-medium text-slate-700">
                        {label}
                    </label>
                )}

                <div className="relative group">
                    {/* Left icon */}
                    {icon && (
                        <div className={clsx(
                            "absolute left-4 top-1/2 -translate-y-1/2 transition-colors",
                            isValid && "text-emerald-500",
                            isInvalid && "text-red-500",
                            !isValid && !isInvalid && "text-slate-400 group-focus-within:text-indigo-500"
                        )}>
                            {icon}
                        </div>
                    )}

                    {/* Input */}
                    <input
                        ref={ref}
                        className={clsx(
                            "w-full py-3 bg-slate-50 border rounded-xl text-lg outline-none transition-all placeholder:text-slate-400",
                            icon ? "pl-12 pr-12" : "pl-4 pr-12",
                            // Border colors based on state
                            isValid && "border-emerald-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20",
                            isInvalid && "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20",
                            !isValid && !isInvalid && "border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20",
                            className
                        )}
                        {...props}
                    />

                    {/* Right status indicator */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        {isValidating && (
                            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                        )}
                        {isValid && !isValidating && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        )}
                        {isInvalid && !isValidating && (
                            <XCircle className="w-5 h-5 text-red-500" />
                        )}
                    </div>
                </div>

                {/* Cleaned domain preview */}
                {showCleanedValue && validationState !== 'idle' && validationState !== 'invalid' && (
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                        <span className="font-medium">Will check:</span>
                        <code className="px-1.5 py-0.5 bg-slate-100 rounded text-indigo-600 font-mono">
                            {showCleanedValue}
                        </code>
                    </p>
                )}

                {/* Error message */}
                {errorMessage && isInvalid && (
                    <p className="text-sm text-red-600 font-medium flex items-center gap-2 animate-in slide-in-from-top-1 fade-in duration-200">
                        <XCircle className="w-4 h-4 flex-shrink-0" />
                        {errorMessage}
                    </p>
                )}

                {/* Helper text */}
                {helperText && !errorMessage && (
                    <p className="text-sm text-slate-500">
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);

ValidatedInput.displayName = 'ValidatedInput';
