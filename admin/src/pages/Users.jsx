import React, { useEffect, useState } from 'react';
import api from '../api';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');

  const loadUsers = () => {
    const params = {};
    if (roleFilter) params.role = roleFilter;
    if (search) params.search = search;
    api.get('/admin/users', { params }).then(({ data }) => setUsers(data.users));
  };

  useEffect(() => { loadUsers(); }, [roleFilter]);

  const toggleVerify = async (userId) => {
    await api.patch(`/admin/users/${userId}/verify`);
    loadUsers();
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Users</h1>

      <div style={styles.filters}>
        <input
          type="text" placeholder="Search by name or email..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
          style={styles.searchInput}
        />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={styles.select}>
          <option value="">All Roles</option>
          <option value="customer">Customer</option>
          <option value="provider">Provider</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div style={styles.table}>
        <div style={{ ...styles.row, ...styles.headerRow }}>
          <span style={{ ...styles.cell, flex: 2 }}>Name</span>
          <span style={{ ...styles.cell, flex: 2 }}>Email</span>
          <span style={styles.cell}>Role</span>
          <span style={styles.cell}>Rating</span>
          <span style={styles.cell}>Verified</span>
          <span style={styles.cell}>Actions</span>
        </div>
        {users.map((u) => (
          <div key={u.id} style={styles.row}>
            <span style={{ ...styles.cell, flex: 2, fontWeight: 500 }}>{u.name}</span>
            <span style={{ ...styles.cell, flex: 2, color: '#636e72' }}>{u.email}</span>
            <span style={styles.cell}>
              <span style={{ ...styles.badge, background: u.role === 'admin' ? '#d63031' : u.role === 'provider' ? '#6c5ce7' : '#0984e3' }}>
                {u.role}
              </span>
            </span>
            <span style={styles.cell}>{u.avg_rating ? parseFloat(u.avg_rating).toFixed(1) : '-'}</span>
            <span style={styles.cell}>{u.is_verified ? 'Yes' : 'No'}</span>
            <span style={styles.cell}>
              <button onClick={() => toggleVerify(u.id)} style={styles.actionBtn}>
                {u.is_verified ? 'Unverify' : 'Verify'}
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  filters: { display: 'flex', gap: 12, marginBottom: 16 },
  searchInput: { flex: 1, padding: 12, fontSize: 14, border: '1px solid #dfe6e9', borderRadius: 8, outline: 'none' },
  select: { padding: 12, fontSize: 14, border: '1px solid #dfe6e9', borderRadius: 8, outline: 'none', minWidth: 150 },
  table: { background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  row: { display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #f0f2f5' },
  headerRow: { background: '#f8f9fa', fontWeight: 600, fontSize: 13, color: '#636e72', textTransform: 'uppercase' },
  cell: { flex: 1, fontSize: 14 },
  badge: { color: '#fff', padding: '3px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' },
  actionBtn: { background: '#0984e3', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
};
