import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "360°Brief - Executive Digest Platform",
  description: "Transform your information overload into actionable insights with 360Brief's executive digest platform.",
  keywords: ["executive briefing", "productivity", "email digest", "calendar digest", "executive assistant"],
  authors: [{ name: "360Brief Team" }],
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://360brief.app",
    title: "360Brief - Executive Digest Platform",
    description: "Transform your information overload into actionable insights.",
    siteName: "360Brief",
  },
  twitter: {
    card: "summary_large_image",
    title: "360Brief",
    description: "Transform your information overload into actionable insights.",
    creator: "@360brief",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.variable} font-sans antialiased h-full bg-white`}>
        {children}
      </body>
    </html>
  );
}
