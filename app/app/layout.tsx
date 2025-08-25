import { Inter, Poiret_One } from "next/font/google";
import "./globals.css";
import ClientLayout from "./ClientLayout";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal"],
  adjustFontFallback: true,
  fallback: ["system-ui", "sans-serif"],
});

const poiretOne = Poiret_One({
  weight: "400", // Poiret One only has one weight
  subsets: ["latin"],
  display: "swap",
  variable: "--font-heading",
  adjustFontFallback: true,
  fallback: ["cursive", "sans-serif"],
});

// ✅ Metadata export only allowed here (server component)
export const metadata = {
  title: "360Brief - Executive Digest Platform",
  description: "Transform your information overload into actionable insights.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${poiretOne.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
