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
      ? "https://andifila.github.io/invitation-wedding"
      : "http://localhost:3000"
  ),
  title: "Wedding Invite — Undangan Pernikahan Digital",
  description:
    "Buat undangan pernikahan digital yang indah. Bagikan ke tamu via WhatsApp. Pantau RSVP secara real-time.",
  manifest: "/manifest.json",
  openGraph: {
    title: "Wedding Invite — Undangan Pernikahan Digital",
    description: "Buat undangan digital elegan, bagikan via WhatsApp, pantau RSVP tamu secara real-time.",
    type: "website",
    locale: "id_ID",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wedding Invite — Undangan Pernikahan Digital",
    description: "Buat undangan digital elegan, bagikan via WhatsApp, pantau RSVP tamu secara real-time.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${playfair.variable} ${inter.variable} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
