import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // For initial load

  useEffect(() => {
    // Rehydrate user state from localStorage on mount
    const storedToken = localStorage.getItem('token');
    const storedUserId = localStorage.getItem('userId');
    const storedUsername = localStorage.getItem('username');
    const storedFullName = localStorage.getItem('fullName');

    if (storedToken && storedUsername && storedUserId) {
      setToken(storedToken);
      setUser({
        userId: parseInt(storedUserId, 10),
        username: storedUsername,
        fullName: storedFullName
      });
    } else {
      // Clean up partial data if any
      logout();
    }
    setIsLoading(false);
  }, []);

  const login = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('userId', userData.userId);
    localStorage.setItem('username', userData.username);
    if(userData.fullName) localStorage.setItem('fullName', userData.fullName);

    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('fullName');
    
    setToken(null);
    setUser(null);
  };

  const isLoggedIn = !!token;

  return (
    <AuthContext.Provider value={{ token, user, isLoggedIn, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
