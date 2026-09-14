import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, apiKey: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in by validating token or just checking localStorage for now
    const token = localStorage.getItem('ivy_access_token');
    const storedUser = localStorage.getItem('ivy_user');
    
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string, apiKey: string) => {
    // First save the API key so it can be used for the login request headers if needed
    // However, login endpoint doesn't require API key? Actually the docs say "Every request must carry the API key".
    localStorage.setItem('ivy_api_key', apiKey);
    
    try {
      const res = await axios.post('https://solve.ivy.homes/auth/login', {
        email,
        password
      }, {
        headers: {
          'X-API-Key': apiKey
        }
      });
      
      const { access_token, refresh_token, user: userData } = res.data;
      
      localStorage.setItem('ivy_access_token', access_token);
      localStorage.setItem('ivy_refresh_token', refresh_token);
      localStorage.setItem('ivy_user', JSON.stringify(userData));
      
      setUser(userData);
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const apiKey = localStorage.getItem('ivy_api_key');
      const token = localStorage.getItem('ivy_access_token');
      await axios.post('https://solve.ivy.homes/auth/logout', {}, {
        headers: {
          'X-API-Key': apiKey,
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.removeItem('ivy_access_token');
      localStorage.removeItem('ivy_refresh_token');
      localStorage.removeItem('ivy_user');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
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
