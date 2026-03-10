import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Geo Domain Generator — Find Local Service + City Domain Names | CrushDomains',
    description: 'Generate hundreds of geo-targeted domain ideas for local SEO niches. Enter any service and location to discover available city domains perfect for flipping or local businesses.',
};

export default function GeneratorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebApplication",
                        "name": "CrushDomains Geo Domain Generator",
                        "applicationCategory": "UtilitiesApplication",
                        "operatingSystem": "Web",
                        "description": "Generate hundreds of geo-targeted domain ideas for local SEO niches."
                    })
                }}
            />
            {children}
        </>
    );
}
