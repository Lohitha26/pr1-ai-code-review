'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages: Record<string, { title: string; description: string }> = {
    Configuration: {
      title: 'Server Configuration Error',
      description: 'There is a problem with the server configuration. Please check your GitHub OAuth credentials in the .env file.',
    },
    AccessDenied: {
      title: 'Access Denied',
      description: 'You do not have permission to sign in. Please contact the administrator.',
    },
    Verification: {
      title: 'Verification Failed',
      description: 'The verification token has expired or has already been used. Please try signing in again.',
    },
    OAuthCallback: {
      title: 'OAuth Callback Error',
      description: 'GitHub OAuth authentication failed. This usually happens when the GitHub OAuth app credentials are invalid or missing.',
    },
    Default: {
      title: 'Authentication Error',
      description: 'An unexpected error occurred during authentication. Please try again.',
    },
  };

  const errorMessage = errorMessages[error || 'Default'] || errorMessages.Default;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white/10 p-8 backdrop-blur-lg">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
            <svg
              className="h-8 w-8 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white">{errorMessage.title}</h2>
          <p className="mt-4 text-gray-300">{errorMessage.description}</p>
          {error && (
            <p className="mt-2 text-sm text-gray-400">Error code: {error}</p>
          )}
        </div>

        <div className="mt-8 space-y-4">
          <Link
            href="/auth/signin"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-3 text-white transition-all hover:bg-purple-700 hover:scale-105"
          >
            Try Again
          </Link>

          <Link
            href="/"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-700 px-4 py-3 text-white transition-all hover:bg-gray-600"
          >
            Back to Home
          </Link>
        </div>

        <div className="mt-6 text-center text-sm text-gray-400">
          <p>Need help? Check your:</p>
          <ul className="mt-2 space-y-1">
            <li>• GitHub OAuth app configuration</li>
            <li>• Environment variables (.env file)</li>
            <li>• Callback URL settings</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
