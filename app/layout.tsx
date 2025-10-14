import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "What's funny?",
  description: "A collection of funny phrases",
  manifest: "/manifest.json",
  icons: {
    icon: ["/favicon.ico", "/icon.svg"],
    apple: "/icon.svg",
    shortcut: "/favicon.ico",
  },
  appleWebApp: {
    title: "What's Funny",
    statusBarStyle: "default",
    capable: true,
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

