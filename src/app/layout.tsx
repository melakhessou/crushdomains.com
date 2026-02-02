import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navigation } from "@/components/Navigation";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Expired Domains for Sale | High-Quality Brandable Domains – CrushDomains',
  description: 'Discover high-quality expired domains with strong SEO value, branding potential, and availability insights. Find premium expired domains on CrushDomains.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "CrushDomains",
              "url": "https://crushdomains.com",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://crushdomains.com/generator?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "CrushDomains",
              "operatingSystem": "Web",
              "applicationCategory": "BusinessApplication",
              "description": "Advanced Domain Investor Tools: Expired Domains, Generation, and Appraisal.",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              }
            })
          }}
        />
        <Navigation />
        {children}
      </body>
    </html>
  );
}
