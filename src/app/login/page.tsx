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
        <h1 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--primary)' }}>醫師公會職域活化</h1>
        
        <div style={{ marginBottom: '2rem', fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
          <p style={{ marginBottom: '1rem', color: 'var(--text)' }}>
            請透過本網頁完成「據點志願序表達」，並同步提交「經營計劃書」。您所回填的計劃書內容，將作為後續遴選面談的重要評估參考，請務必詳實展現貴單位的經營策略與發展願景。
          </p>
          
          <p style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: '0.5rem' }}>📌 填寫須知與重要時程</p>
          <ul style={{ paddingLeft: '1.2rem', marginBottom: '1rem' }}>
            <li><strong>回填開放時間：</strong> 2026年4月13日（一）起至 4月17日（五）12:00 截止。</li>
            <li><strong>資料用途：</strong> 作為本次據點分派之志願序依據，以及後續遴選面談的審查資料。</li>
            <li><strong>資料修改與覆蓋機制：</strong> 於截止時間前，若需調整志願序或更新經營計劃書，請直接重新填寫並送出整份表單。系統將自動以您「最後一次」送出的紀錄為準進行覆蓋。</li>
          </ul>

          <p style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: '0.5rem' }}>💡 填寫前準備建議</p>
          <ol style={{ paddingLeft: '1.2rem', marginBottom: '1rem' }}>
            <li><strong>確認志願順序：</strong> 建議先與團隊內部討論凝聚共識，排定本次釋出據點的優先順序。</li>
            <li><strong>經營成員名單：</strong> 請與後續實際經營人員名單盡量一致。</li>
            <li><strong>備妥計劃書內容：</strong> 為避免網頁停留時間過長導致操作中斷，請於填寫前先將「經營計劃書」定稿，以利快速完成填寫作業。</li>
          </ol>

          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', marginTop: '1rem' }}>
            <p><strong>專案聯絡窗口：</strong></p>
            <p>聯絡人：温婓娜 #6693</p>
          </div>
        </div>
        
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
