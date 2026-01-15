import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  isLoggedIn: boolean;
  loading: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLogin = () => {
      const loggedIn = localStorage.getItem('pimpows_logged_in') === 'true';
      setIsLoggedIn(loggedIn);
      setLoading(false);
    };

    checkLogin();

    // Listen for storage changes (for multi-tab support)
    window.addEventListener('storage', checkLogin);
    return () => window.removeEventListener('storage', checkLogin);
  }, []);

  const signOut = () => {
    localStorage.removeItem('pimpows_logged_in');
    setIsLoggedIn(false);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
