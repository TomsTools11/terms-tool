'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Upload, Library, LogOut, User } from 'lucide-react';
import { useAuth } from './AuthProvider';

export default function Navbar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const navItems = [
    { href: '/', label: 'Extract', icon: Upload },
    { href: '/glossary', label: 'Glossary', icon: Library },
  ];

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/login';
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-[var(--color-text-primary)] hover:text-[var(--color-blue-primary)] transition-colors"
          >
            <BookOpen className="h-6 w-6 text-[var(--color-blue-primary)]" />
            <span className="text-xl font-semibold" style={{ fontFamily: "'Red Hat Display', system-ui, sans-serif" }}>
              TermsTool
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              {navItems.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                      ${isActive
                        ? 'bg-[var(--color-blue-primary)] text-white'
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                );
              })}
            </div>

            {user && (
              <div className="flex items-center gap-3 pl-3 border-l border-[var(--color-border)]">
                <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline max-w-[150px] truncate">
                    {user.email}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
