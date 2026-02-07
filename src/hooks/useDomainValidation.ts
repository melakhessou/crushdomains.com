'use client';

import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { appraisalFormSchema, cleanDomain, type AppraisalFormData } from '@/lib/validation';

interface UseDomainValidationOptions {
    onValidSubmit?: (domain: string) => void | Promise<void>;
    showToasts?: boolean;
}

export function useDomainValidation(options: UseDomainValidationOptions = {}) {
    const { onValidSubmit, showToasts = true } = options;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cleanedDomain, setCleanedDomain] = useState('');

    const form = useForm<AppraisalFormData>({
        resolver: zodResolver(appraisalFormSchema),
        mode: 'onSubmit', // Validate only on submit, not while typing
        defaultValues: {
            domain: '',
        },
    });

    const {
        register,
        handleSubmit,
        formState: { errors, isValid, isValidating, isSubmitted },
        watch,
        setError,
        clearErrors,
    } = form;

    // Watch the domain value for real-time cleaning preview
    const domainValue = watch('domain');

    useEffect(() => {
        if (domainValue) {
            setCleanedDomain(cleanDomain(domainValue));
        } else {
            setCleanedDomain('');
        }
    }, [domainValue]);

    // Get validation state for styling - only show after submit attempt
    const getValidationState = useCallback((): 'idle' | 'valid' | 'invalid' | 'validating' => {
        if (isValidating) return 'validating';
        if (!isSubmitted) return 'idle'; // Stay idle until form is submitted
        if (errors.domain) return 'invalid';
        if (isValid) return 'valid';
        return 'idle';
    }, [isValidating, isSubmitted, errors.domain, isValid]);

    const onSubmit = useCallback(async (data: AppraisalFormData) => {
        setIsSubmitting(true);

        try {
            if (showToasts) {
                toast.loading('Analyzing domain...', { id: 'domain-analysis' });
            }

            await onValidSubmit?.(data.domain);

            if (showToasts) {
                toast.success(`Domain ${data.domain} validated!`, {
                    id: 'domain-analysis',
                    duration: 2000,
                });
            }
        } catch (error) {
            if (showToasts) {
                toast.error('Failed to analyze domain', {
                    id: 'domain-analysis',
                    duration: 3000,
                });
            }
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    }, [onValidSubmit, showToasts]);

    const submitHandler = handleSubmit(onSubmit);

    return {
        // Form registration
        register,
        handleSubmit: submitHandler,

        // State
        errors,
        isValid,
        isValidating,
        isSubmitting,

        // Computed values
        cleanedDomain,
        validationState: getValidationState(),
        hasError: !!errors.domain,
        errorMessage: errors.domain?.message,

        // Form utilities
        setError,
        clearErrors,
        form,
    };
}
