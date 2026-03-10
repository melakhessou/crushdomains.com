import { ExpiredDomainsDashboard } from '@/components/ExpiredDomainsDashboard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Filter Expiring & Deleting Domains — NameJet CSV Analyzer | CrushDomains',
    description: 'Upload your NameJet or marketplace CSV and instantly filter deleting domains by keyword, TLD, length, and more. Find undervalued expired domains fast.',
};

export default function FilterPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebApplication",
                        "name": "CrushDomains Expiring Domain Filter",
                        "applicationCategory": "UtilitiesApplication",
                        "operatingSystem": "Web",
                        "description": "Upload your NameJet or marketplace CSV and instantly filter deleting domains by keyword, TLD, length, and more."
                    })
                }}
            />
            <ExpiredDomainsDashboard />
        </>
    );
}
