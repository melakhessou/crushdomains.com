import { Loader2 } from 'lucide-react';

export default function AuctionsLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-indigo-100 relative">
            {/* ── Top Progress Bar ── */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-100 overflow-hidden z-50">
                <div className="h-full bg-indigo-600 animate-pulse origin-left" />
            </div>

            {/* ── Central Spinner ── */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-40 bg-white/10 backdrop-blur-[1px]">
                <div className="bg-white/80 p-8 rounded-3xl shadow-2xl border border-white/50 flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                    <span className="text-indigo-900 font-bold tracking-tight text-center">Loading auctions...</span>
                </div>
            </div>

            <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-8 space-y-6 opacity-40 pointer-events-none select-none">

                {/* ── Header Skeleton ── */}
                <header className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-200 rounded-lg animate-pulse" />
                            <div className="h-9 w-64 bg-slate-300/50 rounded-xl animate-pulse" />
                        </div>
                        <div className="h-4 w-96 bg-slate-300/40 rounded animate-pulse" />
                    </div>

                    <div className="w-32 h-10 bg-indigo-200/50 rounded-xl animate-pulse shadow-sm" />
                </header>

                {/* ── Status Bar Skeleton ── */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="w-20 h-7 bg-emerald-100/50 rounded-full animate-pulse border border-emerald-200/50" />
                    <div className="w-32 h-7 bg-white/80 rounded-full animate-pulse border border-slate-200/50" />
                    <div className="w-48 h-7 bg-indigo-100/50 rounded-full animate-pulse border border-indigo-200/50" />
                </div>

                {/* ── Table Card Skeleton ── */}
                <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white overflow-hidden">

                    {/* Filter Toggle Skeleton */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 bg-slate-300/40 rounded animate-pulse" />
                            <div className="w-28 h-5 bg-slate-300/40 rounded animate-pulse" />
                        </div>
                    </div>

                    {/* Table Skeleton */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50/50 border-b border-slate-200">
                                <tr>
                                    {Array.from({ length: 9 }).map((_, i) => (
                                        <th key={i} className="px-4 py-5 font-medium">
                                            <div className="h-3 w-16 bg-slate-300/40 rounded animate-pulse" />
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <tr key={i} className="border-b border-slate-50/50 transition-colors">
                                        <td className="px-4 py-5">
                                            <div className="h-5 w-10 bg-slate-200/60 rounded-md animate-pulse" />
                                        </td>
                                        <td className="px-4 py-5 text-indigo-600">
                                            <div className="h-4 w-48 bg-indigo-100/40 rounded animate-pulse" />
                                        </td>
                                        <td className="px-4 py-5">
                                            <div className="h-4 w-24 bg-slate-200/60 rounded animate-pulse" />
                                        </td>
                                        <td className="px-4 py-5 font-mono font-semibold">
                                            <div className="h-4 w-16 bg-slate-200/60 rounded animate-pulse" />
                                        </td>
                                        <td className="px-4 py-5">
                                            <div className="h-5 w-8 bg-slate-200/60 rounded-full animate-pulse" />
                                        </td>
                                        <td className="px-4 py-5">
                                            <div className="h-4 w-16 bg-slate-200/60 rounded animate-pulse" />
                                        </td>
                                        <td className="px-4 py-5">
                                            <div className="h-5 w-14 bg-emerald-100/40 rounded animate-pulse" />
                                        </td>
                                        <td className="px-4 py-5">
                                            <div className="h-4 w-12 bg-slate-200/60 rounded animate-pulse" />
                                        </td>
                                        <td className="px-4 py-5">
                                            <div className="h-6 w-14 bg-indigo-100/40 rounded-lg animate-pulse" />
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
