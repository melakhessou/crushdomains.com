import { z } from 'zod';

// Domain validation regex
const DOMAIN_REGEX = /^((?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)+[A-Za-z]{2,63}$/;

/**
 * Cleans a domain input by removing protocols, www prefix, 
 * trimming whitespace, and converting to lowercase
 */
export function cleanDomain(input: string): string {
    return input
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, '')  // Remove http:// or https://
        .replace(/^www\./, '')         // Remove www.
        .replace(/\/.*$/, '');          // Remove trailing paths
}

/**
 * Zod schema for domain validation with auto-cleanup transform
 */
export const domainSchema = z
    .string({ message: 'Domain name is required' })
    .min(1, 'Domain name is required')
    .max(253, 'Domain too long (max 253 characters)')
    .transform(cleanDomain)
    .refine(
        (domain) => DOMAIN_REGEX.test(domain),
        {
            message: 'Invalid format. Ex: example.com or sub.example.io',
        }
    );

/**
 * Form schema for the appraisal form
 */
export const appraisalFormSchema = z.object({
    domain: domainSchema,
});

// Type exports
export type DomainInput = z.input<typeof domainSchema>;
export type ValidDomain = z.output<typeof domainSchema>;
export type AppraisalFormData = z.infer<typeof appraisalFormSchema>;

/**
 * Validates a domain and returns result with cleaned value
 */
export function validateDomain(input: string): {
    success: boolean;
    data?: string;
    error?: string;
} {
    const result = domainSchema.safeParse(input);

    if (result.success) {
        return { success: true, data: result.data };
    }

    // Zod v4 uses .issues instead of .errors
    const firstIssue = result.error.issues?.[0];
    return {
        success: false,
        error: firstIssue?.message || 'Invalid domain'
    };
}
