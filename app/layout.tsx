import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AppNav } from "./nav";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Capture",
  description: "Capture anything, instantly.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Capture",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#182442",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>
        <AppNav />
        <div className="app-content">{children}</div>
      </body>
    </html>
  );
}
