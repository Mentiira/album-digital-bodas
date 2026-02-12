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
      <body style={{ margin: 0 }}>
        {/* Pre-loader estático para evitar el fogonazo visual antes de la hidratación */}
        <div id="initial-loader" style={{
          position: 'fixed',
          inset: 0,
          background: '#F8F7F2',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999999,
          fontFamily: 'serif'
        }}>
          <div style={{
            width: '45px',
            height: '45px',
            border: '3px solid rgba(184, 134, 11, 0.15)',
            borderTop: '3px solid #B8860B',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '20px'
          }}></div>
          <div style={{ color: '#2d3436', fontSize: '18px', letterSpacing: '1px', opacity: 0.8 }}>
            Vibefly Digital
          </div>
          <style>{`
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            .loaded #initial-loader { 
              display: none !important; 
            }
          `}</style>
        </div>

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
