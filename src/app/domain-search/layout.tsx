import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Domain Search - CrushDomains',
    description:
        'Search domain availability and pricing in bulk using Dynadot. Generate domain ideas from keywords and find available .com, .net, .io domains instantly.',
};

export default function DomainSearchLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
