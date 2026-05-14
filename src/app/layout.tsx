import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PupaVision v3 — Live Camera & Upload · Team Pentrix",
  description:
    "Automated Silkworm Pupa Sex Identification using MobileNetV2 with Grad-CAM explainability. Team Pentrix, AY 2025-26.",
  keywords: [
    "PupaVision",
    "silkworm",
    "pupa",
    "sex identification",
    "MobileNetV2",
    "Grad-CAM",
    "sericulture",
  ],
  authors: [{ name: "Team Pentrix" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ background: '#09100F', color: '#E8F5F2' }}
      >
        {children}
      </body>
    </html>
  );
}
