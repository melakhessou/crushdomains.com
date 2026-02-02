import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Domain Name Generator | Smart & Brandable Domain Ideas – CrushDomains',
    description: 'Generate intelligent, brandable, and available .com domain names using keywords and niche-based AI logic. Find your next domain name with CrushDomains.',
};

export default function GeneratorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
