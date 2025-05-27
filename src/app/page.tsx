import AiChatContent from './components/AiChatContent';

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[rgba(80,88,126,0.94)] to-[rgba(102,120,206,0.94)] text-white">
      <div className="container flex h-[100vh] flex-col items-center p-4">
        <AiChatContent />
      </div>
    </main>
  );
}
