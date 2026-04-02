import React, { useState } from 'react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onLogin(email, password);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h1 style={styles.title}>Admin Login</h1>
        <p style={styles.subtitle}>Services Marketplace</p>

        {error && <div style={styles.error}>{error}</div>}

        <input
          type="email" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input} required
        />
        <input
          type="password" placeholder="Password" value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input} required
        />

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  wrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' },
  form: { background: '#fff', padding: 40, borderRadius: 16, width: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  title: { fontSize: 24, fontWeight: 700, textAlign: 'center', marginBottom: 4 },
  subtitle: { textAlign: 'center', color: '#636e72', marginBottom: 24 },
  error: { background: '#ffe0e0', color: '#d63031', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 },
  input: { width: '100%', padding: 14, fontSize: 15, border: '1px solid #dfe6e9', borderRadius: 10, marginBottom: 12, outline: 'none' },
  button: { width: '100%', padding: 14, fontSize: 16, fontWeight: 600, color: '#fff', background: '#0984e3', border: 'none', borderRadius: 10, cursor: 'pointer', marginTop: 8 },
};
