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
  title: "WeddingInvite — Beautiful Digital Invitations",
  description:
    "Create stunning, personalized wedding invitations. Share with guests via WhatsApp. Track RSVPs in real-time.",
  openGraph: {
    title: "WeddingInvite — Beautiful Digital Invitations",
    description: "Create stunning, personalized wedding invitations.",
    type: "website",
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
