'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

// Netlify Identity user type
interface NetlifyUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
  app_metadata?: {
    provider?: string;
  };
}

interface NetlifyIdentityAPI {
  init: () => void;
  open: (tab?: 'login' | 'signup') => void;
  close: () => void;
  logout: () => void;
  currentUser: () => NetlifyUser | null;
  on: (event: string, callback: (user?: NetlifyUser) => void) => void;
}

interface AuthContextType {
  user: NetlifyUser | null;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<NetlifyUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [netlifyIdentity, setNetlifyIdentity] = useState<NetlifyIdentityAPI | null>(null);

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;

    // Dynamically import netlify-identity-widget
    import('netlify-identity-widget').then((identity) => {
      const api = identity.default as unknown as NetlifyIdentityAPI;
      setNetlifyIdentity(api);

      // Initialize the widget
      api.init();

      // Check for existing user
      const currentUser = api.currentUser();
      if (currentUser) {
        setUser({
          id: currentUser.id,
          email: currentUser.email,
          user_metadata: currentUser.user_metadata,
          app_metadata: currentUser.app_metadata,
        });
      }
      setIsLoading(false);

      // Listen for login events
      api.on('login', (loggedInUser) => {
        if (loggedInUser) {
          setUser({
            id: loggedInUser.id,
            email: loggedInUser.email,
            user_metadata: loggedInUser.user_metadata,
            app_metadata: loggedInUser.app_metadata,
          });
        }
        api.close();
      });

      // Listen for logout events
      api.on('logout', () => {
        setUser(null);
      });

      // Listen for init events (handles redirect after OAuth login)
      api.on('init', (initUser) => {
        if (initUser) {
          setUser({
            id: initUser.id,
            email: initUser.email,
            user_metadata: initUser.user_metadata,
            app_metadata: initUser.app_metadata,
          });
        }
      });
    });

    return () => {
      // Cleanup listeners if needed
    };
  }, []);

  const login = useCallback(() => {
    if (netlifyIdentity) {
      netlifyIdentity.open('login');
    }
  }, [netlifyIdentity]);

  const logout = useCallback(() => {
    if (netlifyIdentity) {
      netlifyIdentity.logout();
    }
  }, [netlifyIdentity]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
