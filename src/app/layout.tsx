import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import Script from "next/script";
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
  title: 'CrushDomains — Domain Appraisal, Geo Generator & Expired Domain Filter Tools',
  description: 'Free SaaS tools for domain investors. Instantly appraise domains, generate geo-targeted local domains, and filter expiring domain lists from NameJet and more.',
  verification: {
    other: {
      'impact-site-verification': '3931a728-8170-4624-a807-8ebd36a8e786',
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-FW7D2DTQ66"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-FW7D2DTQ66');
          `}
        </Script>
      </head>
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
