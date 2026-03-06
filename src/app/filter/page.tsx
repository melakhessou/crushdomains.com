import { ExpiredDomainsDashboard } from '@/components/ExpiredDomainsDashboard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Filter Deleting Domains | CrushDomains',
    description: 'Discover high-quality deleting domains with strong SEO value and branding potential.',
};

export default function FilterPage() {
    return <ExpiredDomainsDashboard />;
}
