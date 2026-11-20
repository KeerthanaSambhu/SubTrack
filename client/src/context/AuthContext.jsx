import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/endpoints';
import { tokenStorage } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // 'loading' while we check a saved token, then 'authenticated' or 'guest'.
  const [status, setStatus] = useState(() => (tokenStorage.get() ? 'loading' : 'guest'));

  // Restore the session from a saved token on first load.
  useEffect(() => {
    if (!tokenStorage.get()) return;
    let cancelled = false;
    authApi
      .me()
      .then(({ user: me }) => {
        if (cancelled) return;
        setUser(me);
        setStatus('authenticated');
      })
      .catch(() => {
        if (cancelled) return;
        tokenStorage.clear();
        setStatus('guest');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // The API client fires this event when the server rejects our token.
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setStatus('guest');
    };
    window.addEventListener('subtrack:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('subtrack:unauthorized', handleUnauthorized);
  }, []);

  const startSession = useCallback(({ token, user: nextUser }) => {
    tokenStorage.set(token);
    setUser(nextUser);
    setStatus('authenticated');
    return nextUser;
  }, []);

  const login = useCallback(
    (credentials) => authApi.login(credentials).then(startSession),
    [startSession],
  );

  const register = useCallback(
    (details) => authApi.register(details).then(startSession),
    [startSession],
  );

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
    setStatus('guest');
  }, []);

  const value = useMemo(
    () => ({ user, status, login, register, logout, setUser }),
    [user, status, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
