import React, { useEffect, useState } from 'react';
import api from '../api';

export default function Payments() {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    api.get('/admin/payments').then(({ data }) => setPayments(data.payments));
  }, []);

  const statusColor = {
    held: '#ffeaa7',
    released: '#55efc4',
    refunded: '#fab1a0',
    disputed: '#ff7675',
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Payments</h1>

      <div style={styles.table}>
        <div style={{ ...styles.row, ...styles.headerRow }}>
          <span style={{ ...styles.cell, flex: 2 }}>Job</span>
          <span style={styles.cell}>Customer</span>
          <span style={styles.cell}>Provider</span>
          <span style={styles.cell}>Amount</span>
          <span style={styles.cell}>Fee</span>
          <span style={styles.cell}>Payout</span>
          <span style={styles.cell}>Status</span>
          <span style={styles.cell}>Date</span>
        </div>
        {payments.map((p) => (
          <div key={p.id} style={styles.row}>
            <span style={{ ...styles.cell, flex: 2, fontWeight: 500 }}>{p.job_title}</span>
            <span style={styles.cell}>{p.customer_name}</span>
            <span style={styles.cell}>{p.provider_name}</span>
            <span style={styles.cell}>${parseFloat(p.amount).toFixed(2)}</span>
            <span style={{ ...styles.cell, color: '#636e72' }}>${parseFloat(p.platform_fee).toFixed(2)}</span>
            <span style={styles.cell}>${parseFloat(p.provider_payout).toFixed(2)}</span>
            <span style={styles.cell}>
              <span style={{ ...styles.badge, background: statusColor[p.status] || '#dfe6e9' }}>
                {p.status}
              </span>
            </span>
            <span style={{ ...styles.cell, color: '#636e72', fontSize: 13 }}>
              {new Date(p.created_at).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>

      {payments.length === 0 && <p style={{ color: '#636e72', textAlign: 'center', marginTop: 40 }}>No payments yet</p>}
    </div>
  );
}

const styles = {
  table: { background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  row: { display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #f0f2f5' },
  headerRow: { background: '#f8f9fa', fontWeight: 600, fontSize: 13, color: '#636e72', textTransform: 'uppercase' },
  cell: { flex: 1, fontSize: 14 },
  badge: { padding: '3px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' },
};
