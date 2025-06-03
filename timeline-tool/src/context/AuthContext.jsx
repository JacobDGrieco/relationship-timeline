import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const icon = localStorage.getItem('icon');
    if (token && username) {
      setUser({ token, username, icon });
    }
  }, []);

  const login = (token, username, icon) => {
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
    localStorage.setItem('icon', icon || '');
    setUser({ token, username, icon });
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
