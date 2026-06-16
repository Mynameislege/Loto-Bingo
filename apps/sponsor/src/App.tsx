import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateOffer from './pages/CreateOffer';
import Stats from './pages/Stats';
import Navbar from './components/Navbar';

export interface AuthCtx {
  token: string | null;
  merchantId: string | null;
  merchantName: string | null;
  login: (token: string, id: string, name: string) => void;
  logout: () => void;
}

export const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

import { createContext, useContext } from 'react';
export const Auth = createContext<AuthCtx>({
  token: null, merchantId: null, merchantName: null,
  login: () => {}, logout: () => {},
});
export const useAuth = () => useContext(Auth);

export default function App() {
  const [token, setToken]           = useState<string | null>(() => localStorage.getItem('sp_token'));
  const [merchantId, setMerchantId] = useState<string | null>(() => localStorage.getItem('sp_mid'));
  const [merchantName, setName]     = useState<string | null>(() => localStorage.getItem('sp_name'));

  const login = (t: string, id: string, name: string) => {
    setToken(t); setMerchantId(id); setName(name);
    localStorage.setItem('sp_token', t);
    localStorage.setItem('sp_mid', id);
    localStorage.setItem('sp_name', name);
  };
  const logout = () => {
    setToken(null); setMerchantId(null); setName(null);
    localStorage.removeItem('sp_token');
    localStorage.removeItem('sp_mid');
    localStorage.removeItem('sp_name');
  };

  return (
    <Auth.Provider value={{ token, merchantId, merchantName, login, logout }}>
      {token && <Navbar />}
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/" /> : <Login />} />
        <Route path="/" element={token ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/create-offer" element={token ? <CreateOffer /> : <Navigate to="/login" />} />
        <Route path="/stats" element={token ? <Stats /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Auth.Provider>
  );
}
