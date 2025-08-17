// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VinoRoute - Yarra Valley",
  description: "Plan your perfect winery tour in the Yarra Valley.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* This link tag adds the wine bottle icon as the favicon */}
        <link 
          rel="icon" 
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🍾</text></svg>" 
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
