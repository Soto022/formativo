import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

const STORAGE_KEY = 'ecoalas_currentUser';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar usuario guardado en localStorage
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error leyendo el usuario de localStorage', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const persistUser = (user) => {
    setCurrentUser(user);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Error guardando el usuario en localStorage', error);
    }
  };

  const register = useCallback(async (username, password) => {
    const response = await fetch(`${API_BASE_URL}/api/autenticacion/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombreUsuario: username, contrasena: password }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.mensaje || 'No se pudo registrar.');
    }

    const data = await response.json();
    const user = {
      id: data._id,
      username: data.nombreUsuario,
      role: data.rol,
      token: data.token,
    };
    persistUser(user);
    return user;
  }, []);

  const login = useCallback(async (username, password) => {
    const response = await fetch(`${API_BASE_URL}/api/autenticacion/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombreUsuario: username, contrasena: password }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.mensaje || 'Credenciales incorrectas.');
    }

    const data = await response.json();
    const user = {
      id: data._id,
      username: data.nombreUsuario,
      role: data.rol,
      token: data.token,
    };
    persistUser(user);
    return user;
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error limpiando localStorage', error);
    }
  }, []);

  const value = {
    currentUser,
    user: currentUser, // alias para componentes antiguos
    isAuthenticated: !!currentUser?.token,
    isAdmin: currentUser?.role === 'admin',
    register,
    login,
    logout,
    loading,
    API_BASE_URL,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
