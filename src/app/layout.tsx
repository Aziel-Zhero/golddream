import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { FirebaseClientProvider } from '@/firebase';
import { ThemeManager } from '@/components/ThemeManager';
import { FaviconManager } from '@/components/FaviconManager';
import { NavbarWrapper as Navbar } from '@/components/NavbarWrapper';
import { FooterWrapper as Footer } from '@/components/FooterWrapper';
import { FloatingWhatsApp } from '@/components/FloatingWhatsApp';

export const metadata: Metadata = {
  title: 'Gold Dream Multimarcas | Estilo e Exclusividade',
  description: 'O melhor da moda premium. Gold Dream Multimarcas - Elegância e qualidade para você.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col bg-background text-foreground" suppressHydrationWarning>
        <FirebaseClientProvider>
          <ThemeManager />
          <FaviconManager />
          <AuthProvider>
            <CartProvider>
              <Navbar />
              <main className="flex-grow">
                {children}
              </main>
              <Footer />
              <FloatingWhatsApp />
              <Toaster />
            </CartProvider>
          </AuthProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}