import type { Metadata } from 'next';
import { AuctionsPageClient } from './AuctionsPageClient';

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

export default function AuctionsPage() {
    return <AuctionsPageClient />;
}
