import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Free Domain Appraisal Tool — Instant Domain Value Estimator | CrushDomains',
    description: 'Get an instant domain name appraisal powered by keyword data, extension value, and market comparables. Free, fast, and built for domain investors and flippers.',
};

export default function AppraisalLayout({
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
                        "name": "CrushDomains Instant Appraisal Tool",
                        "applicationCategory": "BusinessApplication",
                        "operatingSystem": "Web",
                        "description": "Get an instant domain name appraisal powered by keyword data, extension value, and market comparables."
                    })
                }}
            />
            {children}
        </>
    );
}
