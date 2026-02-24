import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { Navigation } from "@/components/Navigation";
import "./globals.css";

const inter = Inter({
  variable: "--font-family-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-family-mono",
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
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
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
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            style: {
              fontFamily: 'var(--font-family-sans)',
            },
          }}
        />
        <Navigation />
        {children}
      </body>
    </html>
  );
}
