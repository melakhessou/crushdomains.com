import { ExternalLink } from 'lucide-react';

export interface Domain {
    domainName: string;
    tld: string;
    length: number;
    deleteDate: string;
}

interface DomainTableProps {
    domains: Domain[];
}

export function DomainTable({ domains }: DomainTableProps) {
    if (domains.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <p className="text-xl font-semibold text-slate-500">No domains found matching your criteria.</p>
                <p className="text-base font-normal">Try adjusting your filters.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="flex-1 overflow-auto">
                <table className="w-full text-base text-left text-slate-600">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100 font-semibold tracking-widest sticky top-0 backdrop-blur-sm z-10">
                        <tr>
                            <th scope="col" className="px-6 py-4">Domain</th>
                            <th scope="col" className="px-6 py-4">Length</th>
                            <th scope="col" className="px-6 py-4">TLD</th>
                            <th scope="col" className="px-6 py-4">Delete Date</th>
                            <th scope="col" className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {domains.map((d, i) => (
                            <tr key={`${d.domainName}-${i}`} className="bg-white/50 hover:bg-indigo-50/30 transition-colors duration-150">
                                <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap text-lg">
                                    {d.domainName.split('.')[0]}<span className="text-slate-400 font-normal">.{d.tld}</span>
                                </td>
                                <td className="px-6 py-3.5">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                                        {d.length}
                                    </span>
                                </td>
                                <td className="px-6 py-3.5">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                        .{d.tld}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-500 font-mono text-sm">{d.deleteDate}</td>
                                <td className="px-6 py-3.5 text-right">
                                    <a
                                        href={`https://${d.domainName}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                                    >
                                        Visit <ExternalLink size={12} />
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
