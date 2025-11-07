/**
 * AI Review Panel Component
 * 
 * Displays AI-powered code review suggestions and allows applying them.
 */

'use client';

import { useState } from 'react';

interface AiReviewPanelProps {
  code: string;
  language: string;
}

interface ReviewSuggestion {
  line: number;
  type: 'error' | 'warning' | 'info' | 'suggestion';
  message: string;
  suggestion?: string;
}

export default function AiReviewPanel({ code, language }: AiReviewPanelProps) {
  const [suggestions, setSuggestions] = useState<ReviewSuggestion[]>([]);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Request AI review
  const requestReview = async () => {
    if (!code.trim()) {
      setError('No code to review');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/ai/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, language }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Use the detailed error message from the API
        throw new Error(data.message || data.error || 'Failed to get AI review');
      }

      setSuggestions(data.suggestions || []);
      setSummary(data.summary || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get AI review');
    } finally {
      setLoading(false);
    }
  };

  // Get icon and color for suggestion type
  const getSuggestionStyle = (type: string) => {
    switch (type) {
      case 'error':
        return { icon: '❌', color: 'text-red-400', bg: 'bg-red-900/20' };
      case 'warning':
        return { icon: '⚠️', color: 'text-yellow-400', bg: 'bg-yellow-900/20' };
      case 'info':
        return { icon: 'ℹ️', color: 'text-blue-400', bg: 'bg-blue-900/20' };
      default:
        return { icon: '💡', color: 'text-green-400', bg: 'bg-green-900/20' };
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800">
      {/* Header */}
      <div className="h-14 border-b border-gray-700 flex items-center justify-between px-4">
        <h2 className="text-white font-semibold">AI Code Review</h2>
        <button
          onClick={requestReview}
          disabled={loading || !code.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
        >
          {loading ? 'Analyzing...' : 'Review Code'}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg">
            <p className="text-red-400 text-sm mb-2">{error}</p>
            {error.includes('quota exceeded') && (
              <a
                href="https://platform.openai.com/account/billing"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-xs underline"
              >
                Add billing to OpenAI account →
              </a>
            )}
          </div>
        )}

        {summary && (
          <div className="mb-4 p-4 bg-gray-700 rounded-lg">
            <h3 className="text-white font-semibold mb-2">Summary</h3>
            <p className="text-gray-300 text-sm">{summary}</p>
          </div>
        )}

        {suggestions.length === 0 && !loading && !error && (
          <div className="text-center text-gray-500 mt-8">
            <p className="mb-2">No suggestions yet</p>
            <p className="text-sm">Click &quot;Review Code&quot; to get AI-powered feedback</p>
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-white font-semibold mb-3">
              Suggestions ({suggestions.length})
            </h3>
            {suggestions.map((suggestion, index) => {
              const style = getSuggestionStyle(suggestion.type);
              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${style.bg} border-gray-700`}
                >
                  <div className="flex items-start space-x-2 mb-2">
                    <span className="text-lg">{style.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`text-sm font-semibold ${style.color}`}>
                          Line {suggestion.line}
                        </span>
                        <span className="text-xs text-gray-500 uppercase">
                          {suggestion.type}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm">{suggestion.message}</p>
                    </div>
                  </div>
                  {suggestion.suggestion && (
                    <div className="mt-2 p-2 bg-gray-900 rounded text-xs text-gray-400 font-mono">
                      {suggestion.suggestion}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
