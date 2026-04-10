'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [mode, setMode] = useState<'user'|'admin_auth'|'admin_dashboard'>('user');
  const [adminCode, setAdminCode] = useState('');
  const [stats, setStats] = useState<any>(null);

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

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminCode === '03434016') { // Hardcoded simple auth for UI protection
       setMode('admin_dashboard');
       fetchAdminStats();
    } else {
       setError('管理員密碼錯誤');
    }
  }

  const fetchAdminStats = async () => {
     setLoading(true);
     try {
       const res = await fetch('/api/admin-stats');
       const d = await res.json();
       setStats(d);
     } catch (err) {
       setError('無法取得統計資料');
     } finally {
       setLoading(false);
     }
  }

  const handleDownload = () => {
    window.location.href = '/api/export';
  };

  if (mode === 'admin_dashboard') {
     return (
      <div className="container fade-in">
        <div className="glass" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>管理後台</h1>
              <p style={{ color: 'var(--text-muted)' }}>整體進度統計與報名資料管理</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button onClick={() => setMode('user')} className="btn-primary" style={{ background: '#64748b' }}>回登入頁</button>
              <button onClick={() => window.open('/print-report', '_blank')} className="btn-primary" style={{ background: '#10b981' }}>下載 PDF 版</button>
              <button onClick={handleDownload} className="btn-primary" style={{ background: '#f59e0b' }}>打包 Excel 版</button>
            </div>
          </div>
        </div>

        {!stats || loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div className="fade-in" style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>載入統計資料中...</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
            <div className="glass" style={{ padding: '2.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h3 style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 600 }}>總填寫率</h3>
              <div style={{ fontSize: '4.5rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>
                {stats.overallRate.toFixed(1)}<span style={{ fontSize: '1.5rem' }}>%</span>
              </div>
              <p style={{ marginTop: '1rem', fontSize: '1.1rem', fontWeight: 500 }}>
                {stats.filledUsers} <span style={{ color: 'var(--text-muted)' }}>/ {stats.totalUsers}</span>
              </p>
              <div style={{ background: '#e2e8f0', height: '12px', borderRadius: '6px', marginTop: '2rem', overflow: 'hidden' }}>
                <div style={{ background: 'var(--primary)', height: '100%', width: `${stats.overallRate}%`, transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)' }}></div>
              </div>
            </div>

            <div className="glass" style={{ padding: '2.5rem' }}>
              <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 600 }}>各區域中心填寫率</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {Object.entries(stats.regionalStats).map(([region, s]: [string, any]) => {
                  const rate = (s.filled / s.total) * 100;
                  return (
                    <div key={region}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.95rem', fontWeight: 500 }}>
                        <span>{region}</span>
                        <span>{s.filled} / {s.total} ({rate.toFixed(1)}%)</span>
                      </div>
                      <div style={{ background: '#e2e8f0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ background: 'var(--primary)', opacity: 0.9, height: '100%', width: `${rate}%`, transition: 'width 0.8s ease-out' }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
     );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem' }}>
      <div className="glass fade-in" style={{ width: '100%', maxWidth: '500px', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)', padding: '3rem 2rem', textAlign: 'center', color: 'white' }}>
           <h1 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1.75rem' }}>醫師公會職域活化</h1>
           <p style={{ opacity: 0.9, fontSize: '0.95rem' }}>據點志願序表達暨經營計劃書提交系統</p>
        </div>

        <div style={{ padding: '2.5rem' }}>
          {mode === 'user' ? (
            <>
              <div style={{ marginBottom: '2.5rem' }}>
                <div className="info-section" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '0.95rem', color: '#334155', lineHeight: '1.7', marginBottom: '1.5rem' }}>
                    請填寫報名資訊並提交經營計劃書。您的內容將作為後續遴選面談的重要評估參考。
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span>📅</span> 重要時程
                      </h4>
                      <p style={{ fontSize: '0.875rem', color: '#475569' }}>
                        2026/04/13 (一) 至 04/17 (五) 12:00
                      </p>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span>💡</span> 填寫建議
                      </h4>
                      <ul style={{ fontSize: '0.875rem', color: '#475569', paddingLeft: '1.25rem', listStyleType: 'circle' }}>
                        <li>系統以「最後一次」送出紀錄為準</li>
                        <li>建議先定稿計劃書內容再快速填寫</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>業務員代碼</label>
                  <input 
                    type="text" 
                    placeholder="請輸入業務員代碼" 
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                  />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>驗證碼 (生日後四碼)</label>
                  <input 
                    type="password" 
                    placeholder="請輸入驗證碼" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    maxLength={4}
                  />
                </div>

                {error && (
                  <div style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', color: '#b91c1c', fontSize: '0.875rem', textAlign: 'center' }}>
                    {error}
                  </div>
                )}
                
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={loading}
                  style={{ marginTop: '0.5rem', padding: '14px' }}
                >
                  {loading ? '登入中...' : '驗證身分並開始報名'}
                </button>
              </form>

              <div style={{ marginTop: '2.5rem', textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                <button 
                  onClick={() => { setMode('admin_auth'); setError(''); }}
                  style={{ background: 'transparent', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}
                >
                  ⚙️ 管理員登入
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleAdminAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>管理員驗證</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>請輸入後台存取密碼</p>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>管理員密碼</label>
                <input 
                  type="password" 
                  placeholder="請輸入密碼" 
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  required
                />
              </div>
              
              {error && (
                <div style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', color: '#b91c1c', fontSize: '0.875rem' }}>
                  {error}
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '14px' }}>
                  {loading ? '驗證中...' : '確認進入後台'}
              </button>

              <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <button 
                  onClick={(e) => { e.preventDefault(); setMode('user'); setError(''); }}
                  style={{ background: 'transparent', color: 'var(--text-muted)', fontSize: '0.875rem' }}
                >
                  返回使用者登入
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
