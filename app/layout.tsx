import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || '';

export const metadata: Metadata = {
  metadataBase: new URL('https://uncanny.app'),
  title: 'UNCANNY / Daily Perception Record',
  description: 'Five unresolved images. Decide what can be trusted.',
  openGraph: {
    title: 'UNCANNY / Daily Perception Record',
    description: 'Five unresolved images. Decide what can be trusted.',
    images: ['/og-image.png'],
    type: 'website',
    url: 'https://uncanny.app',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UNCANNY / Daily Perception Record',
    description: 'Five unresolved images. Decide what can be trusted.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
  },
  other: {
    'google-adsense-account': 'ca-pub-3572878125126394',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        {/* H5 Games Ads — must be in head as raw script (Next.js Script adds data-nscript which AdSense rejects) */}
        <script
          async
          crossOrigin="anonymous"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3572878125126394"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.adsbygoogle = window.adsbygoogle || [];
              var adBreak = adConfig = function(o) { adsbygoogle.push(o); };
              adConfig({ preloadAdBreaks: 'on', sound: 'on' });
            `,
          }}
        />
      </head>
      <body className="bg-background text-foreground font-body antialiased">
        {children}

        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
