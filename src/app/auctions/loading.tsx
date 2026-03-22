import { Loader2 } from 'lucide-react';

export default function AuctionsLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20 relative">
            {/* ── Top Progress Bar ── */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-100 dark:bg-indigo-950 overflow-hidden z-50">
                <div className="h-full bg-indigo-600 dark:bg-indigo-500 animate-pulse origin-left" />
            </div>

            {/* ── Central Spinner ── */}
            <div className="fixed inset-0 flex flex-col items-center justify-center z-40 bg-white/20 dark:bg-slate-950/40 backdrop-blur-[2px]">
                <style dangerouslySetInnerHTML={{
                    __html: `
                    .custom-loader {
                        --d: 22px;
                        width: 4px;
                        height: 4px;
                        border-radius: 50%;
                        color: #6366f1;
                        box-shadow: 
                            calc(1*var(--d))      calc(0*var(--d))     0 0,
                            calc(0.707*var(--d))  calc(0.707*var(--d)) 0 1px,
                            calc(0*var(--d))      calc(1*var(--d))     0 2px,
                            calc(-0.707*var(--d)) calc(0.707*var(--d)) 0 3px,
                            calc(-1*var(--d))     calc(0*var(--d))     0 4px,
                            calc(-0.707*var(--d)) calc(-0.707*var(--d))0 5px,
                            calc(0*var(--d))      calc(-1*var(--d))    0 6px;
                        animation: l27 1s infinite steps(8);
                    }
                    @keyframes l27 {
                        100% {transform: rotate(1turn)}
                    }
                    .dark .custom-loader {
                        color: #818cf8;
                    }
                `}} />
                <div className="bg-white/90 dark:bg-slate-900/90 p-12 rounded-[40px] shadow-[0_32px_64px_-16px_rgba(99,102,241,0.2)] dark:shadow-[0_32px_64px_-16px_rgba(99,102,241,0.1)] border border-white dark:border-slate-800 flex flex-col items-center gap-12 max-w-[90vw]">
                    <div className="relative flex items-center justify-center w-24 h-24">
                        <div className="custom-loader"></div>
                    </div>
                    <div className="space-y-2 text-center">
                        <h3 className="text-xl font-extrabold text-indigo-950 dark:text-indigo-100 tracking-tight">Loading Auctions</h3>
                        <p className="text-sm text-indigo-500/80 dark:text-indigo-400/80 font-medium">Fetching the latest domain data...</p>
                    </div>
                </div>
            </div>

            <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-8 space-y-6 opacity-40 pointer-events-none select-none">

                {/* ── Header Skeleton ── */}
                <header className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-200 dark:bg-indigo-900/50 rounded-lg animate-pulse" />
                            <div className="h-9 w-64 bg-slate-300/50 dark:bg-slate-700/50 rounded-xl animate-pulse" />
                        </div>
                        <div className="h-4 w-96 bg-slate-300/40 dark:bg-slate-700/40 rounded animate-pulse" />
                    </div>

                    <div className="w-32 h-10 bg-indigo-200/50 dark:bg-indigo-900/50 rounded-xl animate-pulse shadow-sm" />
                </header>

                {/* ── Status Bar Skeleton ── */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="w-20 h-7 bg-emerald-100/50 dark:bg-emerald-500/10 rounded-full animate-pulse border border-emerald-200/50 dark:border-emerald-500/20" />
                    <div className="w-32 h-7 bg-white/80 dark:bg-slate-800/80 rounded-full animate-pulse border border-slate-200/50 dark:border-slate-700/50" />
                    <div className="w-48 h-7 bg-indigo-100/50 dark:bg-indigo-500/10 rounded-full animate-pulse border border-indigo-200/50 dark:border-indigo-500/20" />
                </div>

                {/* ── Table Card Skeleton ── */}
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white dark:border-slate-800 overflow-hidden">

                    {/* Filter Toggle Skeleton */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/50">
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 bg-slate-300/40 dark:bg-slate-700/40 rounded animate-pulse" />
                            <div className="w-28 h-5 bg-slate-300/40 dark:bg-slate-700/40 rounded animate-pulse" />
                        </div>
                    </div>

                    {/* Table Skeleton */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    {Array.from({ length: 9 }).map((_, i) => (
                                        <th key={i} className="px-4 py-5 font-medium">
                                            <div className="h-3 w-16 bg-slate-300/40 dark:bg-slate-700/40 rounded animate-pulse" />
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <tr key={i} className="border-b border-slate-50/50 dark:border-slate-800/50 transition-colors">
                                        <td className="px-4 py-5">
                                            <div className="h-5 w-10 bg-slate-200/60 dark:bg-slate-700/60 rounded-md animate-pulse" />
                                        </td>
                                        <td className="px-4 py-5">
                                            <div className="h-4 w-48 bg-indigo-100/40 dark:bg-indigo-500/20 rounded animate-pulse" />
                                        </td>
                                        <td className="px-4 py-5">
                                            <div className="h-4 w-24 bg-slate-200/60 dark:bg-slate-700/60 rounded animate-pulse" />
                                        </td>
                                        <td className="px-4 py-5 font-mono font-semibold">
                                            <div className="h-4 w-16 bg-slate-200/60 dark:bg-slate-700/60 rounded animate-pulse" />
                                        </td>
                                        <td className="px-4 py-5">
                                            <div className="h-5 w-8 bg-slate-200/60 dark:bg-slate-700/60 rounded-full animate-pulse" />
                                        </td>
                                        <td className="px-4 py-5">
                                            <div className="h-4 w-16 bg-slate-200/60 dark:bg-slate-700/60 rounded animate-pulse" />
                                        </td>
                                        <td className="px-4 py-5">
                                            <div className="h-5 w-14 bg-emerald-100/40 dark:bg-emerald-500/20 rounded animate-pulse" />
                                        </td>
                                        <td className="px-4 py-5">
                                            <div className="h-4 w-12 bg-slate-200/60 dark:bg-slate-700/60 rounded animate-pulse" />
                                        </td>
                                        <td className="px-4 py-5">
                                            <div className="h-6 w-14 bg-indigo-100/40 dark:bg-indigo-500/20 rounded-lg animate-pulse" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </div>
    );
}
