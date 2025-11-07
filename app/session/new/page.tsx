'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function NewSessionPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      // Redirect to sign in
      router.push('/auth/signin?callbackUrl=/session/new');
      return;
    }

    if (status === 'authenticated') {
      // Redirect to sessions page where they can create a session
      router.push('/sessions');
    }
  }, [status, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <div className="text-white text-xl">Redirecting...</div>
    </div>
  );
}
