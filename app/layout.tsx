import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: '#030213',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "MySCP — Specialised Concrete Pumping",
  description: "MySCP workforce management for Specialised Concrete Pumping",
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'MySCP',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    apple: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
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
        {/* Splash screen background matches app */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* Prevent black flash on iOS */}
        <style>{`
          html, body { background-color: #ffffff; }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
