import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NODE_ENV === "production"
      ? "https://andifila.github.io/hadirku"
      : "http://localhost:3000"
  ),
  title: "Hadirku — Undangan Pernikahan Digital",
  description:
    "Buat undangan pernikahan digital yang indah. Bagikan ke tamu via WhatsApp. Pantau RSVP secara real-time.",
  manifest: "/manifest.json",
  openGraph: {
    title: "Hadirku — Undangan Pernikahan Digital",
    description: "Buat undangan digital elegan, bagikan via WhatsApp, pantau RSVP tamu secara real-time.",
    type: "website",
    locale: "id_ID",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hadirku — Undangan Pernikahan Digital",
    description: "Buat undangan digital elegan, bagikan via WhatsApp, pantau RSVP tamu secara real-time.",
  },
};

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' https:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "font-src 'self' data: https://fonts.gstatic.com",
  "frame-src https://maps.google.com https://www.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${playfair.variable} ${inter.variable} h-full`}>
      <head>
        <meta httpEquiv="Content-Security-Policy" content={CSP} />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
      </head>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
