import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { WalletContextProvider } from '@/providers/WalletProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Vouch -- Dating reputation you can\'t reset',
  description: 'Portable, signed dating reputation on Solana',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-zinc-100 min-h-screen`}>
        <WalletContextProvider>
          {children}
        </WalletContextProvider>
      </body>
    </html>
  );
}
