import { ExpiredDomainsDashboard } from '@/components/ExpiredDomainsDashboard';
import { Metadata } from 'next';

type Props = {
    params: { niche: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const niche = params.niche.charAt(0).toUpperCase() + params.niche.slice(1);
    return {
        title: `${niche} Expired Domains | Premium ${niche} Domain Names – CrushDomains`,
        description: `Discover high-quality expired ${niche} domains. Find the best ${niche} domain names with strong SEO value and branding potential on CrushDomains.`,
    };
}

export default function NichePage({ params }: Props) {
    const niche = params.niche.charAt(0).toUpperCase() + params.niche.slice(1);
    return <ExpiredDomainsDashboard initialSearch={params.niche} nicheTitle={niche} />;
}
