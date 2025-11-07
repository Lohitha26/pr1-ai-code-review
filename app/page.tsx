import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-6xl font-bold text-center mb-8 text-white">
          Real-Time Code Collaboration
        </h1>
        <p className="text-xl text-center mb-12 text-gray-300">
          Collaborate on code in real-time with AI-powered code review
        </p>
        
        <div className="flex gap-4 justify-center">
          <Link
            href="/session/new"
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Create New Session
          </Link>
          <Link
            href="/sessions"
            className="px-8 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
          >
            Join Session
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="p-6 bg-gray-800 rounded-lg">
            <h3 className="text-xl font-semibold mb-2 text-white">Real-Time Sync</h3>
            <p className="text-gray-400">
              See changes instantly with CRDT-based synchronization
            </p>
          </div>
          <div className="p-6 bg-gray-800 rounded-lg">
            <h3 className="text-xl font-semibold mb-2 text-white">Live Cursors</h3>
            <p className="text-gray-400">
              Track collaborators with live cursor positions and selections
            </p>
          </div>
          <div className="p-6 bg-gray-800 rounded-lg">
            <h3 className="text-xl font-semibold mb-2 text-white">AI Review</h3>
            <p className="text-gray-400">
              Get intelligent code suggestions powered by OpenAI
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
