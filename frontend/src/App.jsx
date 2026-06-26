import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Suppliers from './pages/Suppliers';
import Warehouses from './pages/Warehouses';
import Goods from './pages/Goods';
import Distributors from './pages/Distributors';
import Regions from './pages/Regions';
import Users from './pages/Users';
import Profile from './pages/Profile';
import ActivityLog from './pages/ActivityLog';
import { api } from './utils/api';

// Route Guard Component
function RequireAuth({ children, user, loading, requiredRole }) {
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-muted)' }}>
        <p>Memvalidasi sesi login...</p>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    alert("Akses ditolak! Anda tidak memiliki izin untuk halaman ini.");
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Inner App with Layout Wrapper
function AppContent({ user, setUser, authLoading }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Find page title dynamically based on active path
  const getPageTitle = (pathname) => {
    switch (pathname) {
      case '/dashboard': return 'Dashboard';
      case '/suppliers': return 'Master Data Supplier';
      case '/warehouses': return 'Master Data Gudang';
      case '/goods': return 'Logistik & Refill Barang';
      case '/distributors': return 'Master Data Distributor';
      case '/regions': return 'Master Data Wilayah';
      case '/users': return 'Manajemen User';
      case '/logs': return 'Audit Activity Log';
      case '/profile': return 'Profil Pengguna';
      default: return 'Portal Logistik';
    }
  };

  const isLoginPage = location.pathname === '/login';

  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  // If user is on login page, render clean without Sidebar & Navbar
  if (isLoginPage) {
    return (
      <Routes>
        <Route 
          path="/login" 
          element={
            user ? <Navigate to="/dashboard" replace /> : <Login onLoginSuccess={setUser} />
          } 
        />
      </Routes>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={handleCloseSidebar} 
        user={user} 
      />

      {/* Main Content Area */}
      <div className="main-content-wrapper" style={{ width: '100%' }}>
        {/* Navbar */}
        <Navbar 
          onMenuToggle={handleMenuToggle} 
          pageTitle={getPageTitle(location.pathname)} 
          user={user} 
        />

        {/* Dynamic Route Pages */}
        <main className="main-content">
          <Routes>
            <Route 
              path="/dashboard" 
              element={
                <RequireAuth user={user} loading={authLoading}>
                  <Dashboard />
                </RequireAuth>
              } 
            />
            <Route 
              path="/suppliers" 
              element={
                <RequireAuth user={user} loading={authLoading}>
                  <Suppliers user={user} />
                </RequireAuth>
              } 
            />
            <Route 
              path="/warehouses" 
              element={
                <RequireAuth user={user} loading={authLoading}>
                  <Warehouses user={user} />
                </RequireAuth>
              } 
            />
            <Route 
              path="/goods" 
              element={
                <RequireAuth user={user} loading={authLoading}>
                  <Goods user={user} />
                </RequireAuth>
              } 
            />
            <Route 
              path="/distributors" 
              element={
                <RequireAuth user={user} loading={authLoading}>
                  <Distributors user={user} />
                </RequireAuth>
              } 
            />
            <Route 
              path="/regions" 
              element={
                <RequireAuth user={user} loading={authLoading}>
                  <Regions user={user} />
                </RequireAuth>
              } 
            />
            <Route 
              path="/users" 
              element={
                <RequireAuth user={user} loading={authLoading} requiredRole="Admin">
                  <Users />
                </RequireAuth>
              } 
            />
            <Route 
              path="/logs" 
              element={
                <RequireAuth user={user} loading={authLoading}>
                  <ActivityLog />
                </RequireAuth>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <RequireAuth user={user} loading={authLoading}>
                  <Profile user={user} onProfileUpdate={setUser} />
                </RequireAuth>
              } 
            />
            
            {/* Fallback redirects */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

// Outer App wrapper with Auth initializer
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = api.getToken();
      if (!token) {
        setAuthLoading(false);
        return;
      }
      try {
        const currentUser = await api.get('/auth/me');
        setUser(currentUser);
      } catch (err) {
        console.error("Auth validation failed, logging out:", err);
        api.logout();
      } finally {
        setAuthLoading(false);
      }
    };
    initializeAuth();
  }, []);

  return (
    <BrowserRouter>
      <AppContent user={user} setUser={setUser} authLoading={authLoading} />
    </BrowserRouter>
  );
}
