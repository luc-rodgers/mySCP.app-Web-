import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MySCP — Specialised Concrete Pumping",
  description: "MySCP workforce management for Specialised Concrete Pumping",
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
