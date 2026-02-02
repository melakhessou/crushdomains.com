import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Domain Appraisal Tool | Check Domain Value Instantly – CrushDomains',
    description: 'Instantly estimate the value of any domain name based on brandability, length, and market potential with CrushDomains domain appraisal tool.',
};

export default function AppraisalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
