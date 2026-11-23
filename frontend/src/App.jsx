import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Diagnostics from './pages/Diagnostics';
import Troubleshooting from './pages/Troubleshooting';
import DFASimulator from './pages/DFASimulator';
import PerformanceAnalyzer from './pages/PerformanceAnalyzer';
import History from './pages/History';
import Reports from './pages/Reports';
import About from './pages/About';

import api from './services/api';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('netassist_user');
    return saved
      ? JSON.parse(saved)
      : { id: 1, username: 'admin', email: 'admin@netassist.local', role: 'Network Administrator' };
  });

  const [networkStatus, setNetworkStatus] = useState('ONLINE');
  const [isRunningDiag, setIsRunningDiag] = useState(false);

  // Poll or check network status periodically
  const checkStatus = async () => {
    try {
      const res = await api.getNetworkStatus();
      if (res.data?.internet?.status) {
        setNetworkStatus(res.data.internet.status.toUpperCase());
      }
    } catch (err) {
      setNetworkStatus('OFFLINE');
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('netassist_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('netassist_user');
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Login Page */}
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/" replace />
            ) : (
              <Login onLoginSuccess={handleLoginSuccess} />
            )
          }
        />

        {/* Protected Application Layout */}
        <Route
          path="/*"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : (
              <div className="flex h-screen flex-col bg-[#080d1a] text-slate-100 overflow-hidden">
                {/* Top Navigation Bar */}
                <Navbar
                  networkStatus={networkStatus}
                  onRefresh={checkStatus}
                  isRunningDiag={isRunningDiag}
                  user={user}
                  onLogout={handleLogout}
                />

                {/* Main Body with Sidebar + Content */}
                <div className="flex flex-1 overflow-hidden">
                  <Sidebar />

                  {/* Scrollable Page Content */}
                  <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/diagnostics" element={<Diagnostics />} />
                      <Route path="/troubleshooting" element={<Troubleshooting />} />
                      <Route path="/automata" element={<DFASimulator />} />
                      <Route path="/performance" element={<PerformanceAnalyzer />} />
                      <Route path="/history" element={<History />} />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/about" element={<About />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </main>
                </div>
              </div>
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
