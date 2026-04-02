import React, { useEffect, useState } from 'react';
import api from '../api';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');

  const loadCategories = () => {
    api.get('/jobs/categories').then(({ data }) => setCategories(data.categories));
  };

  useEffect(() => { loadCategories(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name || !slug) return;
    try {
      await api.post('/admin/categories', { name, slug, description });
      setName(''); setSlug(''); setDescription('');
      loadCategories();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add category');
    }
  };

  const toggleActive = async (id, isActive) => {
    await api.put(`/admin/categories/${id}`, { is_active: !isActive });
    loadCategories();
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Categories</h1>

      <form onSubmit={handleAdd} style={styles.form}>
        <input placeholder="Name" value={name} onChange={(e) => { setName(e.target.value); setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-')); }} style={styles.input} />
        <input placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} style={styles.input} />
        <input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} style={{ ...styles.input, flex: 2 }} />
        <button type="submit" style={styles.addBtn}>Add</button>
      </form>

      <div style={styles.grid}>
        {categories.map((cat) => (
          <div key={cat.id} style={{ ...styles.card, opacity: cat.is_active ? 1 : 0.5 }}>
            <h3 style={{ fontSize: 16, marginBottom: 4 }}>{cat.name}</h3>
            <p style={{ fontSize: 13, color: '#636e72', marginBottom: 8 }}>{cat.description || cat.slug}</p>
            <button
              onClick={() => toggleActive(cat.id, cat.is_active)}
              style={{ ...styles.toggleBtn, background: cat.is_active ? '#d63031' : '#00b894' }}
            >
              {cat.is_active ? 'Disable' : 'Enable'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  form: { display: 'flex', gap: 8, marginBottom: 20 },
  input: { flex: 1, padding: 12, fontSize: 14, border: '1px solid #dfe6e9', borderRadius: 8, outline: 'none' },
  addBtn: { background: '#00b894', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 },
  card: { background: '#fff', padding: 16, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  toggleBtn: { color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
};
