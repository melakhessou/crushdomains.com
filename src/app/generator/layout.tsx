import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Geo Domain Generator | Smart & Brandable Domain Ideas – CrushDomains',
    description: 'Generate intelligent, location-based, and available .com domain names using keywords and geo-targeted AI logic. Find your next domain name with CrushDomains.',
};

export default function GeneratorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
