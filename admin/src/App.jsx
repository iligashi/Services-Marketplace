import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import api from './api';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Disputes from './pages/Disputes';
import Payments from './pages/Payments';
import Categories from './pages/Categories';
import Login from './pages/Login';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      api.get('/auth/profile')
        .then(({ data }) => {
          if (data.user.role !== 'admin') {
            localStorage.removeItem('admin_token');
            setUser(null);
          } else {
            setUser(data.user);
          }
        })
        .catch(() => {
          localStorage.removeItem('admin_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.user.role !== 'admin') {
      throw new Error('Admin access only');
    }
    localStorage.setItem('admin_token', data.accessToken);
    setUser(data.user);
    navigate('/');
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setUser(null);
    navigate('/login');
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/users', label: 'Users' },
    { path: '/disputes', label: 'Disputes' },
    { path: '/payments', label: 'Payments' },
    { path: '/categories', label: 'Categories' },
  ];

  return (
    <div style={styles.layout}>
      <aside style={styles.sidebar}>
        <div style={styles.logo}>Admin Panel</div>
        <nav style={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                ...styles.navItem,
                ...(location.pathname === item.path ? styles.navItemActive : {}),
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div style={styles.userInfo}>
          <div style={styles.userName}>{user.name}</div>
          <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
        </div>
      </aside>
      <main style={styles.main}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/disputes" element={<Disputes />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/categories" element={<Categories />} />
        </Routes>
      </main>
    </div>
  );
}

const styles = {
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: 18, color: '#636e72' },
  layout: { display: 'flex', minHeight: '100vh' },
  sidebar: { width: 240, backgroundColor: '#1a1a2e', color: '#fff', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0 },
  logo: { padding: '24px 20px', fontSize: 20, fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.1)' },
  nav: { flex: 1, padding: '12px 0' },
  navItem: { display: 'block', padding: '12px 20px', color: 'rgba(255,255,255,0.7)', fontSize: 15, transition: 'all 0.2s', cursor: 'pointer' },
  navItemActive: { color: '#fff', backgroundColor: 'rgba(255,255,255,0.1)', borderLeft: '3px solid #0984e3' },
  userInfo: { padding: 20, borderTop: '1px solid rgba(255,255,255,0.1)' },
  userName: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 8 },
  logoutBtn: { background: 'none', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', width: '100%', fontSize: 14 },
  main: { marginLeft: 240, flex: 1, padding: 24 },
};
