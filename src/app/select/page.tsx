'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SelectionPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Revised State: 3 package picks + 1 shared details object
  const [packagePicks, setPackagePicks] = useState<string[]>(['', '', '']);
  const [details, setDetails] = useState({
    promoPlan: '',
    mgmtMechanism: '',
    target: '',
    convener: '',
    teamMembers: [] as string[]
  });

  const [modalPackage, setModalPackage] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetch('/api/selection-data')
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => router.push('/login'));
  }, [router]);

  const getGroupedPackages = () => {
    if (!data?.packages) return [];
    return data.packages.reduce((acc: any[], current: any) => {
      const existing = acc.find(p => p.包序號 === current.包序號);
      if (!existing) {
        acc.push({ ...current, items: [current] });
      } else {
        existing.items.push(current);
      }
      return acc;
    }, []);
  };

  const groupedPackages = getGroupedPackages();

  const handlePickChange = (index: number, value: string) => {
    const nextPicks = [...packagePicks];
    nextPicks[index] = value;
    setPackagePicks(nextPicks);
  };

  const updateDetail = (field: string, value: any) => {
    setDetails({ ...details, [field]: value });
  };

  const handleSubmit = async () => {
    if (packagePicks.some(p => !p)) {
      setError('請填滿三個志願的包序號');
      return;
    }
    if (new Set(packagePicks).size !== 3) {
      setError('三個志願的包序號不能重複');
      return;
    }
    if (!details.promoPlan || !details.convener) {
      setError('請填寫所有詳情欄位並選擇總召');
      return;
    }

    setSubmitting(true);
    setError('');

    // Transform to the format expected by the API (3 records with shared details)
    const selections = packagePicks.map((id, index) => ({
      priority: index + 1,
      packageId: id,
      ...details
    }));

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selections }),
      });

      if (res.ok) {
        alert('報名成功！');
        router.push('/admin');
      } else {
        const d = await res.json();
        setError(d.message || '提交失敗');
      }
    } catch (err) {
      setError('提交發生錯誤');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>載入中...</div>;

  return (
    <div className="container fade-in">
      {/* Header with Admin shortcut */}
      <div className="glass" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ color: 'var(--primary)' }}>{data.user.姓名} ({data.user.業務員代碼})</h2>
          <p style={{ color: 'var(--text-muted)' }}>{data.user.區域中心} - {data.user.通訊處}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => router.push('/admin')} className="btn-primary" style={{ background: '#059669' }}>管理後台</button>
          <button onClick={() => router.push('/login')} className="btn-primary" style={{ background: '#475569' }}>登出</button>
        </div>
      </div>

      {/* Package Reference */}
      <div className="glass" style={{ padding: '1.5rem', marginBottom: '2.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>包序號參考清單 (點選編號看詳情)</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{ padding: '0.75rem' }}>包序號</th>
                <th style={{ padding: '0.75rem' }}>建議人數</th>
                <th style={{ padding: '0.75rem' }}>職域內容</th>
              </tr>
            </thead>
            <tbody>
              {groupedPackages.map((pkg: any) => (
                <tr key={pkg.包序號} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <td style={{ padding: '0.75rem' }}>
                    <button onClick={() => setModalPackage(pkg)} style={{ background: 'transparent', color: 'var(--primary)', textDecoration: 'underline', padding: 0 }}>{pkg.包序號}</button>
                  </td>
                  <td style={{ padding: '0.75rem' }}>{pkg.建議經營團隊人數}</td>
                  <td style={{ padding: '0.75rem' }}>{pkg.items.length} 個職域資料</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="fade-in">
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--accent)', textAlign: 'center' }}>報名資料填寫</h2>
        
        {/* Step 1: Priority Selection */}
        <div className="glass" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h4 style={{ marginBottom: '1.5rem', borderLeft: '4px solid #fbbf24', paddingLeft: '1rem' }}>志願選擇</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[0, 1, 2].map(idx => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>第 {idx + 1} 志願</label>
                <select 
                  value={packagePicks[idx]} 
                  onChange={e => handlePickChange(idx, e.target.value)}
                  style={{ width: '100%', padding: '12px' }}
                >
                  <option value="">-- 請選擇包序號 --</option>
                  {groupedPackages.map((pkg: any) => (
                    <option key={pkg.包序號} value={pkg.包序號}>包序號: {pkg.包序號}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Step 2: Shared Details */}
        <div className="glass" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h4 style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--primary)', paddingLeft: '1rem' }}>詳細資料 (僅需填寫一次)</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600 }}>推動規劃</label>
              <textarea rows={3} value={details.promoPlan} onChange={e => updateDetail('promoPlan', e.target.value)} style={{ width: '100%' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600 }}>人員經營管理及跟催機制</label>
              <textarea rows={3} value={details.mgmtMechanism} onChange={e => updateDetail('mgmtMechanism', e.target.value)} style={{ width: '100%' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600 }}>經營目標</label>
              <textarea rows={3} value={details.target} onChange={e => updateDetail('target', e.target.value)} style={{ width: '100%' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600 }}>總召 (限通訊處同仁)</label>
              <select value={details.convener} onChange={e => updateDetail('convener', e.target.value)} style={{ width: '100%', padding: '12px' }}>
                <option value="">-- 選擇總召 --</option>
                {data.members.map((m: any) => (
                  <option key={m.業務員代碼} value={m.業務員代碼}>{m.姓名} ({m.職級})</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600 }}>團隊成員 (可多選)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                {data.members.map((m: any) => (
                  <label key={m.業務員代碼} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '10px', borderRadius: '4px', fontSize: '1rem', background: details.teamMembers.includes(m.業務員代碼) ? 'rgba(14, 165, 233, 0.2)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <input type="checkbox" checked={details.teamMembers.includes(m.業務員代碼)} onChange={e => {
                      const next = e.target.checked ? [...details.teamMembers, m.業務員代碼] : details.teamMembers.filter(c => c !== m.業務員代碼);
                      updateDetail('teamMembers', next);
                    }} />
                    <span>{m.姓名} ({m.職級})</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ textAlign: 'center', paddingBottom: '5rem' }}>
          {error && <div style={{ color: '#ef4444', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>{error}</div>}
          <button className="btn-primary" style={{ fontSize: '1.25rem', padding: '1.2rem 5rem', width: '100%', maxWidth: '400px' }} disabled={submitting} onClick={handleSubmit}>{submitting ? '提交中...' : '確認報名提交'}</button>
        </div>
      </div>

      {modalPackage && (
        <div className="modal-overlay" onClick={() => setModalPackage(null)}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem' }}>包序號 {modalPackage.包序號} 詳情</h3>
              <button onClick={() => setModalPackage(null)} style={{ background: 'transparent', color: 'white', fontSize: '2rem', padding: '0 10px' }}>&times;</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--primary)', background: 'rgba(255,255,255,0.05)' }}>
                    {Object.keys(modalPackage.items[0]).filter(key => key !== 'items' && key !== '可選擇的區域中心').map(key => (
                      <th key={key} style={{ padding: '0.75rem' }}>{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modalPackage.items.map((it: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      {Object.keys(it).filter(key => key !== 'items' && key !== '可選擇的區域中心').map(k => (
                        <td key={k} style={{ padding: '0.75rem' }}>{String(it[k])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}><button className="btn-primary" onClick={() => setModalPackage(null)}>關閉</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
