'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SelectionItem {
  priority: number;
  packageId: string;
  promoPlan: string;
  mgmtMechanism: string;
  target: string;
  convener: string;
  teamMembers: string[];
}

export default function SelectionPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selections, setSelections] = useState<SelectionItem[]>([
    { priority: 1, packageId: '', promoPlan: '', mgmtMechanism: '', target: '', convener: '', teamMembers: [] },
    { priority: 2, packageId: '', promoPlan: '', mgmtMechanism: '', target: '', convener: '', teamMembers: [] },
    { priority: 3, packageId: '', promoPlan: '', mgmtMechanism: '', target: '', convener: '', teamMembers: [] }
  ]);
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

  // Group packages by 包序號 for the reference table and dropdowns
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

  const updateSelection = (index: number, field: keyof SelectionItem, value: any) => {
    const newSelections = [...selections];
    newSelections[index] = { ...newSelections[index], [field]: value };
    setSelections(newSelections);
  };

  const handleSubmit = async () => {
    // Basic validation
    if (selections.some(s => !s.packageId)) {
      setError('請為所有志願選擇包序號');
      return;
    }

    const packageIds = selections.map(s => s.packageId);
    if (new Set(packageIds).size !== 3) {
      setError('三個志願的包序號不能重複');
      return;
    }

    if (selections.some(s => !s.promoPlan || !s.convener)) {
        setError('請填寫所有欄位並選擇總召');
        return;
    }

    setSubmitting(true);
    setError('');

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
      <div className="glass" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: 'var(--primary)' }}>{data.user.姓名} ({data.user.業務員代碼})</h2>
          <p style={{ color: 'var(--text-muted)' }}>{data.user.區域中心} - {data.user.通訊處}</p>
        </div>
        <button onClick={() => router.push('/login')} className="btn-primary" style={{ background: '#475569' }}>登出</button>
      </div>

      {/* Reference Table */}
      <div className="glass" style={{ padding: '1.5rem', marginBottom: '2.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>包序號參考清單 (點選編號看詳情)</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{ padding: '0.75rem' }}>包序號</th>
                <th style={{ padding: '0.75rem' }}>建議人數</th>
                <th style={{ padding: '0.75rem' }}>職域數</th>
              </tr>
            </thead>
            <tbody>
              {groupedPackages.map((pkg: any) => (
                <tr key={pkg.包序號} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <td style={{ padding: '0.75rem' }}>
                    <button 
                      onClick={() => setModalPackage(pkg)} 
                      style={{ background: 'transparent', color: 'var(--primary)', textDecoration: 'underline', padding: 0 }}
                    >
                      {pkg.包序號}
                    </button>
                  </td>
                  <td style={{ padding: '0.75rem' }}>{pkg.建議經營團隊人數}</td>
                  <td style={{ padding: '0.75rem' }}>{pkg.items.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="fade-in">
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--accent)', textAlign: 'center', fontSize: '1.5rem' }}>報名詳細資料填寫</h2>
        
        {selections.map((item, idx) => (
          <div key={idx} className="glass" style={{ padding: '1.5rem', marginBottom: '2rem', borderTop: `4px solid ${idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : '#b45309'}` }}>
            <h4 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ border: '2px solid var(--primary)', borderRadius: '50%', width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>{idx + 1}</span>
              志願 {idx + 1}
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Package ID Selection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: 600 }}>選擇包序號 (必填)</label>
                <select 
                  value={item.packageId} 
                  onChange={e => updateSelection(idx, 'packageId', e.target.value)}
                  style={{ width: '100%', padding: '12px' }}
                >
                  <option value="">-- 請選擇包序號 --</option>
                  {groupedPackages.map((pkg: any) => (
                    <option key={pkg.包序號} value={pkg.包序號}>包序號: {pkg.包序號} (建議 {pkg.建議經營團隊人數} 人)</option>
                  ))}
                </select>
              </div>

              {/* Vertical Textareas */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: 600 }}>推動規劃 (必填)</label>
                <textarea 
                  rows={3} 
                  value={item.promoPlan} 
                  placeholder="請輸入推動規劃..."
                  onChange={e => updateSelection(idx, 'promoPlan', e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: 600 }}>人員經營管理及跟催機制 (必填)</label>
                <textarea 
                  rows={3} 
                  value={item.mgmtMechanism} 
                  placeholder="請輸入跟催機制..."
                  onChange={e => updateSelection(idx, 'mgmtMechanism', e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: 600 }}>經營目標 (必填)</label>
                <textarea 
                  rows={3} 
                  value={item.target} 
                  placeholder="請輸入經營目標..."
                  onChange={e => updateSelection(idx, 'target', e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Convener */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: 600 }}>總召 (必填 - 限通訊處同仁)</label>
                <select 
                  value={item.convener} 
                  onChange={e => updateSelection(idx, 'convener', e.target.value)}
                  style={{ width: '100%', padding: '12px' }}
                >
                  <option value="">-- 選擇總召 --</option>
                  {data.members.map((m: any) => (
                    <option key={m.業務員代碼} value={m.業務員代碼}>{m.姓名} ({m.職級})</option>
                  ))}
                </select>
              </div>

              {/* Multi-Team Members Checkboxes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: 600 }}>團隊成員 (可多選)</label>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', 
                  gap: '0.5rem', 
                  maxHeight: '200px', 
                  overflowY: 'auto',
                  padding: '1rem',
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '8px',
                  border: '1px solid var(--glass-border)'
                }}>
                  {data.members.map((m: any) => (
                    <label key={m.業務員代碼} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem', 
                      cursor: 'pointer',
                      padding: '6px',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                      transition: 'background 0.2s',
                      background: item.teamMembers.includes(m.業務員代碼) ? 'rgba(14, 165, 233, 0.2)' : 'transparent'
                    }}>
                      <input 
                        type="checkbox" 
                        checked={item.teamMembers.includes(m.業務員代碼)}
                        onChange={e => {
                          const current = item.teamMembers;
                          const next = e.target.checked 
                            ? [...current, m.業務員代碼]
                            : current.filter(c => c !== m.業務員代碼);
                          updateSelection(idx, 'teamMembers', next);
                        }}
                      />
                      <span>{m.姓名}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        <div style={{ textAlign: 'center', marginTop: '2rem', paddingBottom: '5rem' }}>
          {error && <div style={{ color: '#ef4444', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{error}</div>}
          <button 
            className="btn-primary" 
            style={{ fontSize: '1.25rem', padding: '1.2rem 5rem', width: '100%', maxWidth: '400px' }}
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting ? '提交中...' : '確認報名提交'}
          </button>
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
                    {Object.keys(modalPackage.items[0])
                      .filter(key => key !== 'items' && key !== '可選擇的區域中心')
                      .map(key => (
                        <th key={key} style={{ padding: '0.75rem' }}>{key}</th>
                      ))
                    }
                  </tr>
                </thead>
                <tbody>
                  {modalPackage.items.map((it: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      {Object.keys(it)
                        .filter(key => key !== 'items' && key !== '可選擇的區域中心')
                        .map(k => (
                          <td key={k} style={{ padding: '0.75rem' }}>{String(it[k])}</td>
                        ))
                      }
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
               <button className="btn-primary" onClick={() => setModalPackage(null)}>關閉詳情</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
