import type { Metadata } from "next";
import { Inter, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { DataProvider } from "@/lib/store";
import { AuthProvider } from "@/lib/auth";
import { BottomNav } from "@/components/bottom-nav";
import { Toaster } from "@/components/ui/toast";
import { AuthGate } from "@/components/auth-gate";

const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });
const notoSansDevanagari = Noto_Sans_Devanagari({ variable: "--font-devanagari", weight: ["400", "500", "600", "700"], subsets: ["devanagari"] });

export const metadata: Metadata = {
  title: "AdvDiary 2.0",
  description: "Legal Case Management PWA for Indian Advocates",
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0B2A5B" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${inter.variable} ${notoSansDevanagari.variable} font-sans min-h-screen bg-background text-foreground antialiased`}>
        <AuthProvider>
          <AuthGate>
            <Toaster>
              <DataProvider>
                <div className="flex flex-col min-h-screen max-w-lg mx-auto">
                  <main className="flex-1 pb-[72px]">
                    {children}
                  </main>
                  <BottomNav />
                </div>
              </DataProvider>
            </Toaster>
          </AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}
