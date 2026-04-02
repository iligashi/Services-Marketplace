import React, { useEffect, useState } from 'react';
import api from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/admin/stats').then(({ data }) => setStats(data));
  }, []);

  if (!stats) return <p>Loading dashboard...</p>;

  const cards = [
    { label: 'Total Users', value: stats.users, color: '#0984e3' },
    { label: 'Providers', value: stats.providers, color: '#6c5ce7' },
    { label: 'Total Jobs', value: stats.jobs, color: '#00b894' },
    { label: 'Active Jobs', value: stats.activeJobs, color: '#fdcb6e' },
    { label: 'Completed Jobs', value: stats.completedJobs, color: '#55efc4' },
    { label: 'Open Disputes', value: stats.openDisputes, color: stats.openDisputes > 0 ? '#d63031' : '#636e72' },
    { label: 'Platform Revenue', value: `$${parseFloat(stats.totalRevenue).toFixed(2)}`, color: '#00b894' },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Dashboard</h1>
      <div style={styles.grid}>
        {cards.map((card) => (
          <div key={card.label} style={styles.card}>
            <div style={{ ...styles.cardValue, color: card.color }}>{card.value}</div>
            <div style={styles.cardLabel}>{card.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 },
  card: { background: '#fff', padding: 24, borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', textAlign: 'center' },
  cardValue: { fontSize: 32, fontWeight: 700, marginBottom: 4 },
  cardLabel: { fontSize: 14, color: '#636e72' },
};
