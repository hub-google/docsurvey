'use client';

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
    
    // Check if priorities are filled and unique
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
              {data.packages.map((pkg: any) => (
                <tr key={pkg.包序號} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <td style={{ padding: '1rem' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(pkg.包序號)}
                      onChange={() => togglePackage(pkg.包序號)}
                    />
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <a href="#" onClick={(e) => { e.preventDefault(); setModalPackage(pkg); }}>{pkg.包序號}</a>
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
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
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
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label>總召 (限通訊處同仁)</label>
                    <select 
                      value={selections[id].convener} 
                      onChange={e => updateSelection(id, 'convener', e.target.value)}
                    >
                      <option value="">選擇總召</option>
                      {data.members.map((m: any) => (
                        <option key={m.業務員代碼} value={m.業務員代碼}>{m.姓名} ({m.職級})</option>
                      ))}
                    </select>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label>團隊成員 (複選)</label>
                    <select 
                      multiple 
                      style={{ height: '100px' }}
                      value={selections[id].teamMembers}
                      onChange={e => {
                        const values = Array.from(e.target.selectedOptions, option => option.value);
                        updateSelection(id, 'teamMembers', values);
                      }}
                    >
                      {data.members.map((m: any) => (
                        <option key={m.業務員代碼} value={m.業務員代碼}>{m.姓名} ({m.職級})</option>
                      ))}
                    </select>
                    <small style={{ color: 'var(--text-muted)' }}>Ctrl+點選 可多選</small>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3>項目詳情: {modalPackage.包序號}</h3>
              <button onClick={() => setModalPackage(null)} style={{ background: 'transparent', color: 'white', fontSize: '1.5rem' }}>&times;</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1rem' }}>
              {Object.entries(modalPackage).map(([key, value]) => {
                  const labelIndex = Object.keys(modalPackage).indexOf(key);
                  // The user said "分頁上秀出這個包序號中，sheet'分包資料'上D欄以後的所有資料"
                  // Assuming column D starts after some specific index. D is 4th column.
                  if (labelIndex < 3) return null; 
                  return (
                    <div key={key} style={{ display: 'contents' }}>
                      <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{key}:</div>
                      <div>{String(value)}</div>
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
