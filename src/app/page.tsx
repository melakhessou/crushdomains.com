import { ExpiredDomainsDashboard } from '@/components/ExpiredDomainsDashboard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Filter Deleting Domains for Sale | High-Quality Brandable Domains – CrushDomains',
  description: 'Discover high-quality deleting domains with strong SEO value, branding potential, and availability insights. Find premium domain names on CrushDomains.',
};

export default function Home() {
  return <ExpiredDomainsDashboard />;
}
