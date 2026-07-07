import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import FloatingElements from "@/components/FloatingElements";
import PageTransition from "@/components/PageTransition";
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
  title: "ShareSchool CI - Partage de ressources pédagogiques",
  description: "Plateforme ivoirienne de partage de ressources pédagogiques pour élèves",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen gradient-bg text-[#f1f5f9]">
        <Providers>
          <FloatingElements />
          <Navbar />
          <main className="pt-16 relative z-10">
            <PageTransition>
              {children}
            </PageTransition>
          </main>
        </Providers>
      </body>
    </html>
  );
}
