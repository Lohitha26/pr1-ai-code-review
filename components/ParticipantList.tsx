/**
 * Participant List Component
 * 
 * Displays active participants in the session with their avatars and status.
 */

'use client';

import { useState, useEffect } from 'react';
import { UserInfo } from '@/lib/socket';

export default function ParticipantList() {
  const [participants, setParticipants] = useState<UserInfo[]>([]);
  const [showList, setShowList] = useState(false);

  // TODO: Connect to socket to receive participant updates
  useEffect(() => {
    // Placeholder - will be connected to socket events
    setParticipants([
      { id: '1', name: 'You', color: '#3b82f6' },
    ]);
  }, []);

  return (
    <div className="relative">
      <button
        onClick={() => setShowList(!showList)}
        className="flex items-center space-x-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
      >
        <div className="flex -space-x-2">
          {participants.slice(0, 3).map((participant) => (
            <div
              key={participant.id}
              className="w-8 h-8 rounded-full border-2 border-gray-800 flex items-center justify-center text-white text-sm font-semibold"
              style={{ backgroundColor: participant.color }}
              title={participant.name}
            >
              {participant.name.charAt(0).toUpperCase()}
            </div>
          ))}
        </div>
        <span className="text-gray-300 text-sm">
          {participants.length} {participants.length === 1 ? 'participant' : 'participants'}
        </span>
      </button>

      {/* Dropdown List */}
      {showList && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
          <div className="p-3 border-b border-gray-700">
            <h3 className="text-white font-semibold">Participants</h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center space-x-3 p-3 hover:bg-gray-700 transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: participant.color }}
                >
                  {participant.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium">{participant.name}</div>
                  <div className="text-gray-400 text-sm">Active</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
