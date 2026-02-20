'use client';

import React, { useState } from 'react';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
    useFloating,
    autoUpdate,
    offset,
    flip,
    shift,
    useDismiss,
    useRole,
    useClick,
    useInteractions,
    FloatingPortal,
    FloatingFocusManager
} from '@floating-ui/react';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Affiliate Link Generators
const getAffiliateLink = (registrar: string, domain: string) => {
    const encodedDomain = encodeURIComponent(domain);
    // Replace these with your actual affiliate IDs/URLs
    const links: Record<string, string> = {
        dynadot: `https://www.dynadot.com/domain/search?domain=${encodedDomain}&aff=CRUSHDOMAINS&utm_source=crushdomains&utm_campaign=dynadot-ambassador`,
        namecheap: `https://www.namecheap.com/domains/registration/results/?domain=${encodedDomain}&aff=YOUR_ID`,
        spaceship: `https://www.spaceship.com/domain-search/?query=${encodedDomain}&aff=YOUR_ID`,
        godaddy: `https://uk.godaddy.com/domainsearch/find?checkAvail=1&domainToCheck=${encodedDomain}&aff=YOUR_ID`,
    };
    return links[registrar] || '#';
};

interface Registrar {
    id: string;
    name: string;
    badge?: string; // e.g. "Best Value"
    icon: React.ReactNode;
}

const REGISTRARS: Registrar[] = [
    {
        id: 'dynadot',
        name: 'Dynadot',
        badge: 'Partner',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                <circle cx="12" cy="12" r="10" stroke="#10B981" strokeWidth="2" />
                <path d="M8 8H12C14.2091 8 16 9.79086 16 12C16 14.2091 14.2091 16 12 16H8V8Z" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
    {
        id: 'namecheap',
        name: 'Namecheap',
        badge: 'Best Value',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#F05F40" stroke="#F05F40" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 17L12 22L22 17" stroke="#F05F40" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="#F05F40" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
    {
        id: 'spaceship',
        name: 'Spaceship',
        badge: 'Lowest Price',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                <circle cx="12" cy="12" r="10" stroke="#4F46E5" strokeWidth="2" />
                <path d="M12 2A10 10 0 0 0 2 12" stroke="#818CF8" strokeWidth="2" />
                <path d="M12 8L16 12L12 16" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8 12H16" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
    {
        id: 'godaddy',
        name: 'GoDaddy',
        badge: 'Popular',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                <path d="M17.5 19C19.9853 19 22 16.9853 22 14.5C22 12.132 20.177 10.2 17.85 10.01" stroke="#1BDBDB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6.5 19C4.01472 19 2 16.9853 2 14.5C2 12.132 3.823 10.2 6.15 10.01" stroke="#1BDBDB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 14C13.6569 14 15 12.6569 15 11C15 9.34315 13.6569 8 12 8C10.3431 8 9 9.34315 9 11C9 12.6569 10.3431 14 12 14Z" stroke="#1BDBDB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
];

interface BuyDomainButtonProps {
    domain: string;
    className?: string; // Allow external styling overrides
    disabled?: boolean;
}

export default function BuyDomainButton({ domain, className, disabled = false }: BuyDomainButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Prevent opening if disabled
    const handleOpenChange = (open: boolean) => {
        if (disabled) {
            setIsOpen(false);
            return;
        }
        setIsOpen(open);
    };

    const { refs, floatingStyles, context } = useFloating({
        open: isOpen,
        onOpenChange: handleOpenChange,
        middleware: [
            offset(8),
            flip({ fallbackAxisSideDirection: 'end' }),
            shift()
        ],
        whileElementsMounted: autoUpdate,
        placement: 'bottom-end',
    });

    const click = useClick(context);
    const dismiss = useDismiss(context);
    const role = useRole(context);

    // Merge interaction props
    const { getReferenceProps, getFloatingProps } = useInteractions([
        click,
        dismiss,
        role,
    ]);


    const handleTrackClick = (registrar: string, url: string) => {
        // Console log for immediate verification
        console.log(`[Affiliate Click] Vendor: ${registrar}, Domain: ${domain}`);

        // Example: Google Analytics Event (if GA4 is initialized)
        // if (typeof window !== 'undefined' && 'gtag' in window) {
        //   window.gtag('event', 'affiliate_click', {
        //     event_category: 'Monetization',
        //     event_label: registrar,
        //     value: domain
        //   });
        // }

        // Close dropdown after click (optional, but good UX)
        setIsOpen(false);
    };

    return (
        <>
            {/* Main Trigger Button */}
            <button
                ref={refs.setReference}
                {...getReferenceProps()}
                type="button"
                className={cn(
                    "inline-flex items-center justify-center gap-2 px-5 py-2.5",
                    "bg-blue-600 hover:bg-blue-700 active:bg-blue-800",
                    "text-white font-medium rounded-lg shadow-sm hover:shadow-md",
                    "transition-all duration-200 ease-in-out",
                    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                    disabled && "opacity-50 cursor-not-allowed hover:bg-blue-600 hover:shadow-sm active:bg-blue-600 grayscale",
                    className
                )}
                disabled={disabled}
            >
                <span>Buy Domain</span>
                <ChevronDown
                    className={cn(
                        "w-4 h-4 transition-transform duration-200",
                        isOpen ? "transform rotate-180" : ""
                    )}
                />
            </button>

            {/* Dropdown Menu via Portal */}
            <FloatingPortal>
                {isOpen && (
                    <FloatingFocusManager context={context} modal={false}>
                        <div
                            ref={refs.setFloating}
                            style={floatingStyles}
                            {...getFloatingProps()}
                            className={cn(
                                "z-[9999] min-w-[16rem]", // High z-index to stay on top
                                "bg-white dark:bg-zinc-900 rounded-xl shadow-xl ring-1 ring-black/5 dark:ring-white/10",
                                "focus:outline-none"
                            )}
                        >
                            <div className="p-1 space-y-0.5">
                                {REGISTRARS.map((registrar) => {
                                    const affiliateLink = getAffiliateLink(registrar.id, domain);

                                    return (
                                        <a
                                            key={registrar.id}
                                            href={affiliateLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => handleTrackClick(registrar.name, affiliateLink)}
                                            className={cn(
                                                "flex items-center justify-between w-full p-3 group",
                                                "rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800",
                                                "transition-colors duration-150"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                {/* Icon Wrapper */}
                                                <div className={cn(
                                                    "flex items-center justify-center w-8 h-8 rounded-full",
                                                    "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
                                                    "group-hover:bg-white group-hover:shadow-sm group-hover:text-blue-600",
                                                    "transition-all duration-200"
                                                )}>
                                                    {registrar.icon}
                                                </div>

                                                <div className="flex flex-col items-start">
                                                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                                        {registrar.name}
                                                    </span>
                                                    {/* Badge display fixed: check logic */}
                                                    {registrar.badge && (
                                                        <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400">
                                                            {registrar.badge}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <ExternalLink className="w-3.5 h-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </a>
                                    );
                                })}
                            </div>

                            {/* Footer / Disclaimer */}
                            <div className="px-3 py-2 border-t border-zinc-100 dark:border-zinc-800">
                                <p className="text-[10px] text-center text-zinc-400">
                                    Affiliate links support our tool
                                </p>
                            </div>
                        </div>
                    </FloatingFocusManager>
                )}
            </FloatingPortal>
        </>
    );
}
