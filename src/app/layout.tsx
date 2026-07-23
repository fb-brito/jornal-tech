import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Jornal Tech",
  description: "Seu jornal tech automatizado com IA.",
  manifest: "/manifest.json",
  referrer: "no-referrer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <header className="border-b" style={{ padding: 'var(--space-md) var(--space-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="font-display" style={{ fontSize: '1.5rem', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
            Jornal Tech
          </div>
          <nav className="font-label text-xs" style={{ display: 'flex', gap: 'var(--space-md)' }}>
            <a href="/" style={{ textDecoration: 'none', color: 'inherit' }}>Página Inicial</a>
            <a href="/nossas-noticias" style={{ textDecoration: 'none', color: 'inherit' }}>Nossas Notícias</a>
            <a href="/nova-noticia" style={{ textDecoration: 'none', color: 'inherit' }}>+ Adicionar Notícia</a>
          </nav>
        </header>
        
        {children}
        
        <footer className="border-t" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
          <div className="font-display text-xl" style={{ textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: 'var(--space-md)' }}>
            Jornal Tech
          </div>
          <div className="font-label text-xs color-ink-2">
            © 2026 Laboratorio-Brito. Designed by Hallmark.
          </div>
        </footer>
      </body>
    </html>
  );
}