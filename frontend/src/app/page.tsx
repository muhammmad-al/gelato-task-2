import Header from '@/components/Header';
import RequestButton from '@/components/RequestButton';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8 flex flex-col items-center">
        <h2 className="text-2xl font-bold text-gray-800">Gelato Faucet Demo</h2>
        <RequestButton />
      </main>
    </div>
  );
}