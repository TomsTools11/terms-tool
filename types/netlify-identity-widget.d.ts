declare module 'netlify-identity-widget' {
  interface User {
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

  function init(): void;
  function open(tab?: 'login' | 'signup'): void;
  function close(): void;
  function logout(): void;
  function currentUser(): User | null;
  function on(event: 'login' | 'logout' | 'init' | 'error' | 'open' | 'close', callback: (user?: User) => void): void;
  function off(event: 'login' | 'logout' | 'init' | 'error' | 'open' | 'close'): void;

  export default {
    init,
    open,
    close,
    logout,
    currentUser,
    on,
    off,
  };
}
