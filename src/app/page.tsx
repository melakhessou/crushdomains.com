import { ExpiredDomainsDashboard } from '@/components/ExpiredDomainsDashboard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Expired Domains for Sale | High-Quality Brandable Domains – CrushDomains',
  description: 'Discover high-quality expired domains with strong SEO value, branding potential, and availability insights. Find premium expired domains on CrushDomains.',
};

export default function Home() {
  return <ExpiredDomainsDashboard />;
}
