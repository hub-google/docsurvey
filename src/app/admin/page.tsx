'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin-stats')
      .then(res => res.json())
      .then(d => {
        setStats(d);
        setLoading(false);
      });
  }, []);

  const handleDownload = () => {
    window.location.href = '/api/export';
  };

  if (loading) return <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>載入統計資料中...</div>;

  return (
    <div className="container fade-in">
      <div className="glass" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: 'var(--primary)' }}>管理後台</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => router.push('/select')} className="btn-primary" style={{ background: '#475569' }}>回報名頁</button>
          <button onClick={handleDownload} className="btn-primary" style={{ background: 'var(--accent)' }}>下載已填寫資料 (Excel)</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass" style={{ padding: '2rem', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>總填寫率</h3>
          <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--primary)' }}>
            {stats.overallRate.toFixed(1)}%
          </div>
          <p style={{ marginTop: '0.5rem' }}>{stats.filledUsers} / {stats.totalUsers}</p>
          <div style={{ background: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '4px', marginTop: '1.5rem', overflow: 'hidden' }}>
            <div style={{ background: 'var(--primary)', height: '100%', width: `${stats.overallRate}%`, transition: 'width 1s ease-out' }}></div>
          </div>
        </div>

        <div className="glass" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>各區域中心填寫率</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {Object.entries(stats.regionalStats).map(([region, s]: [string, any]) => {
              const rate = (s.filled / s.total) * 100;
              return (
                <div key={region}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                    <span>{region}</span>
                    <span>{s.filled} / {s.total} ({rate.toFixed(1)}%)</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.1)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ background: 'var(--primary)', opacity: 0.8, height: '100%', width: `${rate}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
