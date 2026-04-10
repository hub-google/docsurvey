'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, password }),
      });

      if (res.ok) {
        router.push('/select');
      } else {
        const data = await res.json();
        setError(data.message || '登入失敗');
      }
    } catch (err) {
      setError('連線發生錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="glass fade-in" style={{ padding: '3rem', width: '100%', maxWidth: '400px' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '0.5rem', color: 'var(--primary)' }}>醫師公會職域活化</h1>
        <p style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--text-muted)' }}>報名系統登入</p>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem' }}>業務員代碼</label>
            <input 
              type="text" 
              placeholder="請輸入業務員代碼" 
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem' }}>驗證碼 (生日後四碼)</label>
            <input 
              type="password" 
              placeholder="請輸入驗證碼" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              maxLength={4}
            />
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', textAlign: 'center' }}>{error}</p>}
          
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            style={{ marginTop: '1rem' }}
          >
            {loading ? '登入中...' : '進入系統'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
          <button 
            onClick={() => router.push('/admin')}
            style={{ background: 'transparent', color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'underline' }}
          >
            管理員登入 / 進入管理後台
          </button>
        </div>
      </div>
    </div>
  );
}
