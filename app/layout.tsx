import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RedNote — Nairobi Life",
  description: "Discover Nairobi life, Kenyan creators, and local products.",
};

export const viewport = {
  themeColor: "#FF2442",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
