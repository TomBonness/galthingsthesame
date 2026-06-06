import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EXPERIMENT NO. 03 // THE GALTON DECISION-TREE",
  description: "An inquiry into subjective choice and mathematical certainty.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="antialiased min-h-screen bg-swiss-bg text-swiss-text selection:bg-swiss-red selection:text-white">
        {children}
      </body>
    </html>
  );
}