import { WalletConnect } from '@/components/WalletConnect';

export default function Home() {
  return (
    <main className="min-h-screen p-6">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Vouch</h1>
        <WalletConnect />
      </header>
      <p className="text-zinc-400">Panels go here.</p>
    </main>
  );
}
