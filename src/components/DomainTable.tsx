import { ExternalLink, Calendar, Gavel, FileText, Copy, Check } from 'lucide-react';
import { NamejetDomain, NamejetSource } from '@/lib/namejet-parser';
import clsx from 'clsx';
import { useState } from 'react';

export type { NamejetDomain };

interface DomainTableProps {
    domains: NamejetDomain[];
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-400 hover:text-indigo-600 relative group"
            title="Copy domain"
        >
            {copied ? (
                <Check size={14} className="text-emerald-500" />
            ) : (
                <Copy size={14} className="group-hover:scale-110 transition-transform" />
            )}
        </button>
    );
}

function SourceBadge({ source }: { source: NamejetSource }) {
    const styles: Record<NamejetSource, string> = {
        deleting: 'bg-rose-50 text-rose-700 border-rose-100',
        preorder: 'bg-amber-50 text-amber-700 border-amber-100',
        live: 'bg-emerald-50 text-emerald-700 border-emerald-100'
    };

    const labels: Record<NamejetSource, string> = {
        deleting: 'Deleting',
        preorder: 'Preorder',
        live: 'Live Auction'
    };

    return (
        <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider', styles[source])}>
            {labels[source]}
        </span>
    );
}

function formatDate(date: Date | null): string {
    if (!date) return '—';
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');

    // If it's midnight, just show date
    if (date.getHours() === 0 && date.getMinutes() === 0) {
        return `${yyyy}-${mm}-${dd}`;
    }
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

export function DomainTable({ domains }: DomainTableProps) {
    if (domains.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <FileText className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-xl font-semibold text-slate-500">No domains found matching your criteria.</p>
                <p className="text-base font-normal">Try adjusting your filters.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white shadow-sm rounded-lg overflow-hidden border border-slate-100">
            {/* ── Desktop Table ── */}
            <div className="hidden md:block flex-1 overflow-auto">
                <table className="w-full text-base text-left text-slate-600">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100 font-semibold tracking-widest sticky top-0 backdrop-blur-sm z-10">
                        <tr>
                            <th scope="col" className="px-6 py-4">Domain</th>
                            <th scope="col" className="px-6 py-4">Type</th>
                            <th scope="col" className="px-6 py-4">Bid</th>
                            <th scope="col" className="px-6 py-4">
                                <span className="flex items-center gap-1.5"><Calendar size={14} /> Closing Date</span>
                            </th>
                            <th scope="col" className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {domains.map((d, i) => (
                            <tr key={`${d.domainName}-${i}`} className="bg-white/50 hover:bg-indigo-50/30 transition-colors duration-150">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <CopyButton text={d.domainName} />
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-900 text-lg">
                                                {d.domainName.split('.')[0]}<span className="text-slate-400 font-normal">.{d.tld}</span>
                                            </span>
                                            <span className="text-xs text-slate-400 font-mono uppercase">Length: {d.length}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-3.5">
                                    <SourceBadge source={d.source} />
                                </td>
                                <td className="px-6 py-3.5">
                                    {d.currentBid !== null ? (
                                        <span className="inline-flex items-center gap-1 font-mono font-bold text-slate-700">
                                            <Gavel size={12} className="text-slate-400" />
                                            ${d.currentBid.toLocaleString()}
                                        </span>
                                    ) : (
                                        <span className="text-slate-300">—</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-slate-500 font-mono text-sm whitespace-nowrap">
                                    {formatDate(d.closingDate)}
                                </td>
                                <td className="px-6 py-3.5 text-right">
                                    <a
                                        href={`https://www.namejet.com/store/basic.action?dom=${d.domainName}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors whitespace-nowrap"
                                    >
                                        Bid / Backorder <ExternalLink size={12} />
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ── Mobile Card List ── */}
            <div className="md:hidden flex-1 overflow-auto divide-y divide-slate-100 bg-slate-50/30">
                {domains.map((d, i) => (
                    <div key={`${d.domainName}-${i}`} className="p-4 bg-white space-y-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2 min-w-0 flex-1">
                                <CopyButton text={d.domainName} />
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="font-bold text-slate-900 text-lg leading-tight break-all">
                                        {d.domainName.split('.')[0]}<span className="text-slate-400 font-normal">.{d.tld}</span>
                                    </span>
                                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                        <SourceBadge source={d.source} />
                                        <span className="text-xs text-slate-400 font-mono font-bold uppercase py-0.5 px-1.5 bg-slate-100/50 rounded border border-slate-100">
                                            LEN: {d.length}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {d.currentBid !== null && (
                                <div className="text-right shrink-0">
                                    <span className="block text-xs text-slate-400 font-bold uppercase tracking-tight">Current Bid</span>
                                    <span className="font-mono font-black text-indigo-600 text-lg leading-none">
                                        ${d.currentBid.toLocaleString()}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-50">
                            <div>
                                <span className="block text-xs text-slate-400 font-bold uppercase tracking-tight flex items-center gap-1">
                                    <Calendar size={12} /> Closing Date
                                </span>
                                <span className="text-sm font-mono text-slate-600 font-bold">
                                    {formatDate(d.closingDate)}
                                </span>
                            </div>
                            <div className="flex-1 sm:max-w-[200px]">
                                <a
                                    href={`https://www.namejet.com/store/basic.action?dom=${d.domainName}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-2.5 text-center text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                                >
                                    Bid / Backorder <ExternalLink size={12} />
                                </a>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div >
    );
}

