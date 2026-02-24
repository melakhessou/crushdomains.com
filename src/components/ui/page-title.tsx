import React, { ReactNode } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface PageTitleProps {
    children: ReactNode;
    className?: string;
    disableTwoTone?: boolean;
}

export function PageTitle({ children, className, disableTwoTone = true }: PageTitleProps) {
    if (!disableTwoTone && typeof children === 'string') {
        const words = children.split(' ');
        if (words.length > 1) {
            const lastWord = words.pop();
            const firstPart = words.join(' ');
            return (
                <h1 className={cn(
                    "text-3xl md:text-4xl font-bold tracking-tight",
                    className
                )}>
                    <span className="text-slate-900">{firstPart} </span>
                    <span className="text-indigo-600">{lastWord}</span>
                </h1>
            );
        }
    }

    return (
        <h1 className={cn(
            "text-3xl md:text-4xl font-bold tracking-tight text-indigo-600",
            className
        )}>
            {children}
        </h1>
    );
}
