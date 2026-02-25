import type { Metadata } from 'next';
import { AuctionsPageClient } from './AuctionsPageClient';
import { getAuctions } from '@/lib/auctions-service';

export const metadata: Metadata = {
    title: 'Dynadot Expired Auctions | CrushDomains',
    description:
        'Browse live expired-domain auctions from Dynadot. Sort by price or bids, filter by TLD, and bid on premium domains — updated every hour.',
    openGraph: {
        title: 'Dynadot Expired Auctions | CrushDomains',
        description: 'Live expired-domain auctions from Dynadot, updated every hour.',
        url: 'https://crushdomains.com/auctions',
        siteName: 'CrushDomains',
        type: 'website',
    },
    robots: { index: true, follow: true },
};

export default async function AuctionsPage() {
    const data = await getAuctions();

    if (data.status === 'error') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-indigo-100">
                <div className="max-w-screen-xl mx-auto px-4 md:px-8 py-12">
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 space-y-3">
                        <h2 className="text-lg font-bold text-red-700">Erreur de chargement des enchères</h2>
                        <p className="text-sm text-red-600">{data.message}</p>
                    </div>
                </div>
            </div>
        );
    }

    return <AuctionsPageClient auctions={data.auctions} generatedAt={data.generatedAt} />;
}
