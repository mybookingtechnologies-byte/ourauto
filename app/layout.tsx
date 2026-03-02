import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OurAuto",
  description: "Dealer-only B2B used car marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bgPrimary text-textColor antialiased">{children}</body>
    </html>
  );
}
