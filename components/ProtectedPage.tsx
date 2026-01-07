'use client';

import { useAuth } from './AuthProvider';
import AppLayout from './AppLayout';
import { LogIn, Loader2 } from 'lucide-react';

interface ProtectedPageProps {
  children: React.ReactNode;
}

export default function ProtectedPage({ children }: ProtectedPageProps) {
  const { user, isLoading, login } = useAuth();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 text-[var(--color-blue-primary)] animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
          <div className="w-20 h-20 bg-[var(--color-blue-primary)]/10 rounded-full flex items-center justify-center">
            <LogIn className="h-10 w-10 text-[var(--color-blue-primary)]" />
          </div>
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-2">
              Sign in required
            </h2>
            <p className="text-[var(--color-text-muted)] mb-6">
              Please sign in to access this page.
            </p>
            <button
              onClick={login}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-blue-primary)] text-white rounded-lg font-medium hover:bg-[var(--color-blue-primary-hover)] transition-colors"
            >
              <LogIn className="h-5 w-5" />
              Sign In
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return <>{children}</>;
}
