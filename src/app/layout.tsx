import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: "Digital Wedding Album",
  description: "Collaborative wedding album for guests",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body>
        <LanguageProvider>
          <AuthProvider>
            <main className="mobile-container">
              {children}
            </main>
            <Toaster position="top-center" richColors />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
