/**
 * Sessions List Page
 * 
 * Displays all available sessions (public + user's private sessions).
 * Allows creating new sessions and joining existing ones.
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Session {
  id: string;
  name: string;
  description?: string;
  language: string;
  isPublic: boolean;
  owner: {
    id: string;
    name: string;
    image?: string;
  };
  participants: Array<{
    user: {
      id: string;
      name: string;
      image?: string;
    };
  }>;
  updatedAt: string;
}

export default function SessionsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch sessions
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/sessions');
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create new session
  const createSession = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (status !== 'authenticated') {
      router.push('/api/auth/signin');
      return;
    }

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      language: formData.get('language') as string,
      isPublic: formData.get('isPublic') === 'on',
    };

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        router.push(`/session/${result.session.id}`);
      }
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Loading sessions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Coding Sessions</h1>
            <p className="text-gray-400">Join or create a collaborative coding session</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Create Session
          </button>
        </div>

        {/* Sessions Grid */}
        {sessions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg mb-4">No sessions available</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Create the first session
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((sess) => (
              <Link
                key={sess.id}
                href={`/session/${sess.id}`}
                className="block p-6 bg-gray-800 hover:bg-gray-750 rounded-lg border border-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-semibold text-white">{sess.name}</h3>
                  {sess.isPublic ? (
                    <span className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded">
                      Public
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-700 text-gray-400 text-xs rounded">
                      Private
                    </span>
                  )}
                </div>
                
                {sess.description && (
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {sess.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    Language: <span className="text-gray-300">{sess.language}</span>
                  </span>
                  <span className="text-gray-500">
                    {sess.participants.length} active
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-700 flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gray-600 rounded-full"></div>
                  <span className="text-gray-400 text-sm">{sess.owner.name}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Session Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-white mb-6">Create New Session</h2>
            
            <form onSubmit={createSession} className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">Session Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="My Coding Session"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Description (optional)</label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="What are you working on?"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Language</label>
                <select
                  name="language"
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="go">Go</option>
                  <option value="rust">Rust</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isPublic"
                  id="isPublic"
                  defaultChecked
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="isPublic" className="ml-2 text-gray-300">
                  Make this session public
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
