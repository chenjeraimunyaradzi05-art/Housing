import type { Metadata } from "next";
import { Inter, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/lib/auth";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "VÖR | Women-Centered Real Estate & Wealth Building",
  description: "Empowering women through real estate investment, co-investing, and generational wealth building. Join a community of women investors today.",
  keywords: ["real estate", "women investing", "co-investment", "wealth building", "property investment"],
  authors: [{ name: "VÖR Team" }],
  openGraph: {
    title: "VÖR | Women-Centered Real Estate & Wealth Building",
    description: "Empowering women through real estate investment and generational wealth building.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfair.variable} ${jetbrainsMono.variable} antialiased`}
        style={{
          fontFamily: "var(--font-inter), system-ui, sans-serif",
        }}
      >
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
