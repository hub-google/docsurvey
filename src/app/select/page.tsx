'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SelectionPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selections, setSelections] = useState<any>({});
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

  // Group packages by 包序號
  const getGroupedPackages = () => {
    if (!data?.packages) return [];
    return data.packages.reduce((acc: any[], current: any) => {
      const existing = acc.find(p => p.包序號 === current.包序號);
      if (!existing) {
        acc.push({ 
          ...current, 
          items: [current] 
        });
      } else {
        existing.items.push(current);
      }
      return acc;
    }, []);
  };

  const groupedPackages = getGroupedPackages();

  const togglePackage = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
      const newSelections = { ...selections };
      delete newSelections[id];
      setSelections(newSelections);
    } else {
      if (selectedIds.length >= 3) {
        alert('最多只能勾選三項');
        return;
      }
      setSelectedIds([...selectedIds, id]);
      setSelections({
        ...selections,
        [id]: {
          packageId: id,
          priority: '',
          promoPlan: '',
          mgmtMechanism: '',
          target: '',
          convener: '',
          teamMembers: [],
        }
      });
    }
  };

  const updateSelection = (id: number, field: string, value: any) => {
    setSelections({
      ...selections,
      [id]: { ...selections[id], [field]: value }
    });
  };

  const handleSubmit = async () => {
    if (selectedIds.length !== 3) {
      setError('必須勾選三項');
      return;
    }

    const submissionData = selectedIds.map(id => selections[id]);
    
    const priorities = submissionData.map(s => parseInt(s.priority));
    if (priorities.some(p => isNaN(p))) {
      setError('請為勾選的項目選擇志願序');
      return;
    }
    if (new Set(priorities).size !== 3) {
      setError('志願序不能重複');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selections: submissionData }),
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

      <div className="glass" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>請勾選三個報名項目</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{ padding: '1rem' }}>勾選</th>
                <th style={{ padding: '1rem' }}>包序號</th>
                <th style={{ padding: '1rem' }}>建議人數</th>
                <th style={{ padding: '1rem' }}>志願序</th>
              </tr>
            </thead>
            <tbody>
              {groupedPackages.map((pkg: any) => (
                <tr key={pkg.包序號} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <td style={{ padding: '1rem' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(pkg.包序號)}
                      onChange={() => togglePackage(pkg.包序號)}
                    />
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <button 
                      onClick={() => setModalPackage(pkg)} 
                      style={{ background: 'transparent', color: 'var(--primary)', textDecoration: 'underline', padding: 0, fontSize: 'inherit' }}
                    >
                      {pkg.包序號}
                    </button>
                  </td>
                  <td style={{ padding: '1rem' }}>{pkg.建議經營團隊人數}</td>
                  <td style={{ padding: '1rem' }}>
                    <select 
                      disabled={!selectedIds.includes(pkg.包序號)}
                      value={selections[pkg.包序號]?.priority || ''}
                      onChange={(e) => updateSelection(pkg.包序號, 'priority', e.target.value)}
                      style={{ padding: '4px 8px' }}
                    >
                      <option value="">請選擇</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="fade-in">
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent)' }}>報名詳細資料填寫</h3>
          {selectedIds.map(id => (
            <div key={id} className="glass" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
              <h4 style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--primary)', paddingLeft: '1rem' }}>
                項目包序號: {id} (志願序: {selections[id]?.priority || '未選'})
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: 'span 2' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label>推動規劃</label>
                      <textarea 
                        rows={3} 
                        value={selections[id].promoPlan} 
                        onChange={e => updateSelection(id, 'promoPlan', e.target.value)}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label>人員經營管理及跟催機制</label>
                      <textarea 
                        rows={3} 
                        value={selections[id].mgmtMechanism} 
                        onChange={e => updateSelection(id, 'mgmtMechanism', e.target.value)}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label>經營目標</label>
                      <textarea 
                        rows={3} 
                        value={selections[id].target} 
                        onChange={e => updateSelection(id, 'target', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label>總召 (限通訊處同仁)</label>
                  <select 
                    value={selections[id].convener} 
                    onChange={e => updateSelection(id, 'convener', e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="">選擇總召</option>
                    {data.members.map((m: any) => (
                      <option key={m.業務員代碼} value={m.業務員代碼}>{m.姓名} ({m.職級})</option>
                    ))}
                  </select>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label>團隊成員 (複選 - 直接勾選)</label>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', 
                    gap: '0.5rem', 
                    maxHeight: '180px', 
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
                        padding: '4px',
                        borderRadius: '4px',
                        fontSize: '0.85rem'
                      }}>
                        <input 
                          type="checkbox" 
                          checked={selections[id].teamMembers.includes(m.業務員代碼)}
                          onChange={e => {
                            const currentMembers = selections[id].teamMembers;
                            const newMembers = e.target.checked 
                              ? [...currentMembers, m.業務員代碼]
                              : currentMembers.filter((code: string) => code !== m.業務員代碼);
                            updateSelection(id, 'teamMembers', newMembers);
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
          
          <div style={{ textAlign: 'center', marginTop: '2rem', paddingBottom: '4rem' }}>
            {error && <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</p>}
            <button 
              className="btn-primary" 
              style={{ fontSize: '1.25rem', padding: '1rem 4rem' }}
              disabled={submitting}
              onClick={handleSubmit}
            >
              {submitting ? '提交中...' : '確認報名提交'}
            </button>
          </div>
        </div>
      )}

      {modalPackage && (
        <div className="modal-overlay" onClick={() => setModalPackage(null)}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
              <h3>包序號 {modalPackage.包序號} - 職域詳情</h3>
              <button 
                onClick={() => setModalPackage(null)} 
                style={{ background: 'transparent', color: 'white', fontSize: '2rem', lineHeight: 1, padding: '0 0.5rem' }}
              >
                &times;
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
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
                  {modalPackage.items.map((item: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      {Object.keys(item)
                        .filter(key => key !== 'items' && key !== '可選擇的區域中心')
                        .map(key => (
                          <td key={key} style={{ padding: '0.75rem' }}>{String(item[key])}</td>
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
