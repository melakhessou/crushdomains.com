
import React, { useState } from 'react';
import {
    useFloating,
    autoUpdate,
    offset,
    flip,
    shift,
    useHover,
    useFocus,
    useDismiss,
    useRole,
    useInteractions,
    FloatingPortal,
} from '@floating-ui/react';
import clsx from 'clsx';

interface TooltipProps {
    content: React.ReactNode;
    children: React.ReactNode;
    className?: string; // For trigger styling if needed
}

export function Tooltip({ children, content, className }: TooltipProps) {
    const [isOpen, setIsOpen] = useState(false);

    const { refs, floatingStyles, context } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
        placement: 'top',
        whileElementsMounted: autoUpdate,
        middleware: [
            offset(5),
            flip({ fallbackAxisSideDirection: 'start' }),
            shift(),
        ],
    });

    const hover = useHover(context, { move: false });
    const focus = useFocus(context);
    const dismiss = useDismiss(context);
    const role = useRole(context, { role: 'tooltip' });

    const { getReferenceProps, getFloatingProps } = useInteractions([
        hover,
        focus,
        dismiss,
        role,
    ]);

    return (
        <>
            <div
                ref={refs.setReference}
                {...getReferenceProps()}
                className={clsx("inline-flex cursor-help", className)}
            >
                {children}
            </div>
            {isOpen && (
                <FloatingPortal>
                    <div
                        ref={refs.setFloating}
                        style={floatingStyles}
                        {...getFloatingProps()}
                        className="z-50 px-3 py-2 text-xs font-medium text-white bg-slate-900 rounded-md shadow-lg max-w-xs animate-in fade-in zoom-in-95 duration-200"
                    >
                        {content}
                        {/* Simple arrow could be added here if desired with FloatingArrow */}
                    </div>
                </FloatingPortal>
            )}
        </>
    );
}
