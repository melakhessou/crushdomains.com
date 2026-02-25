'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Loader2, AlertCircle } from 'lucide-react';

interface CheckboxCaptchaProps {
    onVerify: (isVerified: boolean) => void;
    reset?: boolean;
    showError?: boolean;
}

export function CheckboxCaptcha({ onVerify, reset, showError }: CheckboxCaptchaProps) {
    const [verifying, setVerifying] = useState(false);
    const [verified, setVerified] = useState(false);

    useEffect(() => {
        if (reset) {
            setVerified(false);
            setVerifying(false);
        }
    }, [reset]);

    const handleCheck = () => {
        if (verified || verifying) return;

        setVerifying(true);
        setTimeout(() => {
            setVerifying(false);
            setVerified(true);
            onVerify(true);
        }, 800);
    };

    return (
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col gap-3 transition-opacity">
            <div
                onClick={handleCheck}
                className={`flex items-center gap-4 p-4 bg-white border rounded-lg cursor-pointer transition-all ${verified ? 'border-green-200 bg-green-50/30' : 'border-gray-200 hover:border-indigo-300 hover:shadow-sm'
                    }`}
            >
                <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${verified ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300'
                    }`}>
                    {verifying ? (
                        <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                    ) : verified ? (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    ) : null}
                </div>

                <div className="flex-grow flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                        {verifying ? 'Verifying...' : verified ? 'Verified' : "I'm not a robot"}
                    </span>
                    <div className="flex flex-col items-end opacity-50">
                        <ShieldCheck className="w-5 h-5 text-gray-400" />
                        <span className="text-[8px] text-gray-400 uppercase tracking-widest font-bold">CrushCaptcha</span>
                    </div>
                </div>
            </div>
            {showError && !verified && (
                <div className="flex items-center gap-2 text-red-500 animate-in fade-in slide-in-from-left-2 duration-300">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-bold">Please check the box first</span>
                </div>
            )}
        </div>
    );
}
