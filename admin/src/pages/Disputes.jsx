import React, { useEffect, useState } from 'react';
import api from '../api';

export default function Disputes() {
  const [disputes, setDisputes] = useState([]);
  const [filter, setFilter] = useState('open');
  const [resolving, setResolving] = useState(null);
  const [resolution, setResolution] = useState('');

  const loadDisputes = () => {
    api.get('/admin/stats').catch(() => {}); // warm up
    api.get('/disputes', { params: { status: filter || undefined } })
      .then(({ data }) => setDisputes(data.disputes));
  };

  useEffect(() => { loadDisputes(); }, [filter]);

  const handleResolve = async (id, action) => {
    if (!resolution.trim()) return alert('Please enter a resolution');
    try {
      await api.patch(`/disputes/${id}/resolve`, { resolution, action });
      setResolving(null);
      setResolution('');
      loadDisputes();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to resolve');
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Disputes</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['open', 'resolved', ''].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{ ...styles.filterBtn, ...(filter === s ? styles.filterBtnActive : {}) }}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {disputes.map((d) => (
        <div key={d.id} style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h3 style={{ fontSize: 16, marginBottom: 4 }}>{d.job_title}</h3>
              <p style={{ fontSize: 13, color: '#636e72' }}>Raised by: {d.raised_by_name} | {new Date(d.created_at).toLocaleDateString()}</p>
            </div>
            <span style={{ ...styles.status, background: d.status === 'open' ? '#ffeaa7' : '#55efc4' }}>
              {d.status.toUpperCase()}
            </span>
          </div>

          <p style={{ fontSize: 14, lineHeight: 1.6, margin: '12px 0' }}>{d.reason}</p>

          {d.status === 'open' && resolving !== d.id && (
            <button onClick={() => setResolving(d.id)} style={styles.resolveBtn}>Resolve</button>
          )}

          {resolving === d.id && (
            <div style={styles.resolveForm}>
              <textarea
                placeholder="Enter resolution details..."
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                style={styles.textarea}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => handleResolve(d.id, 'refund')} style={{ ...styles.actionBtn, background: '#d63031' }}>
                  Refund Customer
                </button>
                <button onClick={() => handleResolve(d.id, 'release')} style={{ ...styles.actionBtn, background: '#00b894' }}>
                  Release to Provider
                </button>
                <button onClick={() => { setResolving(null); setResolution(''); }} style={{ ...styles.actionBtn, background: '#636e72' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {d.resolution && (
            <div style={styles.resolutionBox}>
              <strong>Resolution:</strong> {d.resolution}
            </div>
          )}
        </div>
      ))}

      {disputes.length === 0 && <p style={{ color: '#636e72', textAlign: 'center', marginTop: 40 }}>No disputes found</p>}
    </div>
  );
}

const styles = {
  filterBtn: { padding: '8px 16px', border: '1px solid #dfe6e9', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 14, textTransform: 'capitalize' },
  filterBtnActive: { background: '#0984e3', color: '#fff', borderColor: '#0984e3' },
  card: { background: '#fff', padding: 20, borderRadius: 12, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  status: { padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700 },
  resolveBtn: { background: '#0984e3', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14 },
  resolveForm: { marginTop: 12, padding: 16, background: '#f8f9fa', borderRadius: 10 },
  textarea: { width: '100%', padding: 12, fontSize: 14, border: '1px solid #dfe6e9', borderRadius: 8, minHeight: 80, marginBottom: 12, resize: 'vertical' },
  actionBtn: { color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500 },
  resolutionBox: { marginTop: 12, padding: 12, background: '#f0f2f5', borderRadius: 8, fontSize: 14, lineHeight: 1.6 },
};
