import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      authApi.getProfile()
        .then((res) => {
          if (res.data.data?.role === 'admin') {
            setUser(res.data.data);
          } else {
            localStorage.removeItem('adminToken');
          }
        })
        .catch(() => {
          localStorage.removeItem('adminToken');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    if (res.data.status === 200 && res.data.data?.role === 'admin') {
      localStorage.setItem('adminToken', res.data.data.token);
      setUser(res.data.data);
      return true;
    }
    throw new Error('Invalid credentials or not an admin');
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
