'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SelectionPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Selection states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [priorityMap, setPriorityMap] = useState<Record<string, string>>({});
  
  // Single shared details object
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
        if (d.previousSubmissions && d.previousSubmissions.length > 0) {
          const first = d.previousSubmissions[0];
          
          // Parse newly formatted comma-separated strings
          const savedPackageIds = String(first.包序號 || '').split(',').map(s => s.trim()).filter(Boolean);
          const savedPriorities = String(first.志願序 || '').split(',').map(s => s.trim()).filter(Boolean);
          
          const newSelectedIds: string[] = [];
          const newPriorityMap: Record<string, string> = {};
          
          savedPackageIds.forEach((pkgId, idx) => {
            newSelectedIds.push(pkgId);
            if (savedPriorities[idx]) {
              newPriorityMap[pkgId] = savedPriorities[idx];
            }
          });
          
          setSelectedIds(newSelectedIds);
          setPriorityMap(newPriorityMap);
          
          setDetails({
             promoPlan: first.推動規劃 || '',
             mgmtMechanism: first.人員經營管理及跟催機制 || '',
             target: first.經營目標 || '',
             convener: String(first.總召業務員代碼 || ''),
             teamMembers: first.團隊成員業務員代碼 ? String(first.團隊成員業務員代碼).split(',').map(s => s.trim()).filter(Boolean) : []
          });
        }
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

  const togglePackage = (id: string) => {
    const strId = String(id);
    if (selectedIds.includes(strId)) {
      setSelectedIds(selectedIds.filter(i => i !== strId));
      const newMap = { ...priorityMap };
      delete newMap[strId];
      setPriorityMap(newMap);
    } else {
      if (selectedIds.length >= 3) {
        alert('最多只能勾選三項志願');
        return;
      }
      setSelectedIds([...selectedIds, strId]);
    }
  };

  const updatePriority = (id: string, value: string) => {
    setPriorityMap({ ...priorityMap, [String(id)]: value });
  };

  const updateDetail = (field: string, value: any) => {
    setDetails({ ...details, [field]: value });
  };

  const handleSave = async (isDraft: boolean) => {
    if (!isDraft) {
      if (selectedIds.length !== 3) {
        setError('必須勾選三項包序號作為志願');
        return;
      }

      const priorities = selectedIds.map(id => parseInt(priorityMap[id]));
      if (priorities.some(p => isNaN(p))) {
        setError('請為勾選的項目完整選擇志願序 (1, 2, 3)');
        return;
      }
      if (new Set(priorities).size !== 3) {
        setError('志願序不能重複');
        return;
      }

      if (!details.promoPlan || !details.mgmtMechanism || !details.target || !details.convener) {
        setError('請填寫所有報名資訊欄位並選擇總召');
        return;
      }
      if (details.teamMembers.length === 0) {
        setError('請至少勾選一位團隊成員');
        return;
      }
    }

    setSubmitting(true);
    setError('');

    // Combine format into one single record
    const combinedPackageIds = selectedIds.join(',');
    const combinedPriorities = selectedIds.map(id => priorityMap[id] || '').join(',');

    const combinedSelection = {
      packageId: combinedPackageIds,
      priority: combinedPriorities,
      promoPlan: details.promoPlan,
      mgmtMechanism: details.mgmtMechanism,
      target: details.target,
      convener: details.convener,
      teamMembers: details.teamMembers
    };

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selections: [combinedSelection], isDraft }),
      });

      if (res.ok) {
        alert(isDraft ? '已暫存報名資料！' : '報名成功！');
        if (!isDraft) router.push('/login');
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
      <div className="glass" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ color: 'var(--primary)' }}>{data.user.姓名} ({data.user.業務員代碼})</h2>
          <p style={{ color: 'var(--text-muted)' }}>{data.user.區域中心} - {data.user.通訊處}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => router.push('/login')} className="btn-primary" style={{ background: '#475569' }}>登出</button>
        </div>
      </div>

      <div className="glass" style={{ padding: '1.5rem', marginBottom: '2.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>請勾選三個報名項目並選擇志願序 (點選編號看詳情)</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{ padding: '0.75rem' }}>勾選</th>
                <th style={{ padding: '0.75rem' }}>包序號</th>
                <th style={{ padding: '0.75rem' }}>建議人數</th>
                <th style={{ padding: '0.75rem' }}>志願序</th>
                <th style={{ padding: '0.75rem' }}>職域內容</th>
              </tr>
            </thead>
            <tbody>
              {groupedPackages.map((pkg: any) => (
                <tr key={pkg.包序號} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <td style={{ padding: '0.75rem' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(String(pkg.包序號))}
                      onChange={() => togglePackage(pkg.包序號)}
                    />
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <button onClick={() => setModalPackage(pkg)} style={{ background: 'transparent', color: 'var(--primary)', textDecoration: 'underline', padding: 0 }}>{pkg.包序號}</button>
                  </td>
                  <td style={{ padding: '0.75rem' }}>{pkg.建議經營團隊人數}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <select 
                      disabled={!selectedIds.includes(String(pkg.包序號))}
                      value={priorityMap[String(pkg.包序號)] || ''}
                      onChange={(e) => updatePriority(pkg.包序號, e.target.value)}
                      style={{ padding: '4px 8px' }}
                    >
                      <option value="">請選擇</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                    </select>
                  </td>
                  <td style={{ padding: '0.75rem' }}>{pkg.items.length} 個職域資料</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="fade-in">
        <div className="glass" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h4 style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--primary)', paddingLeft: '1rem', fontSize: '1.25rem' }}>報名資訊</h4>
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
                  <label key={m.業務員代碼} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '10px', borderRadius: '4px', fontSize: '1rem', background: details.teamMembers.includes(String(m.業務員代碼)) ? 'rgba(14, 165, 233, 0.2)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <input type="checkbox" checked={details.teamMembers.includes(String(m.業務員代碼))} onChange={e => {
                      const next = e.target.checked ? [...details.teamMembers, String(m.業務員代碼)] : details.teamMembers.filter(c => c !== String(m.業務員代碼));
                      updateDetail('teamMembers', next);
                    }} />
                    <span>{m.姓名} ({m.職級})</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ textAlign: 'center', paddingBottom: '5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          {error && <div style={{ color: '#ef4444', marginBottom: '0.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>{error}</div>}
          
          <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '400px', flexDirection: 'column' }}>
            <button 
              className="btn-primary" 
              style={{ fontSize: '1.25rem', padding: '1.2rem', width: '100%' }} 
              disabled={submitting} 
              onClick={() => handleSave(false)}
            >
              {submitting ? '提交中...' : '確認報名提交'}
            </button>

            <button 
              className="btn-primary" 
              style={{ fontSize: '1.1rem', padding: '1rem', width: '100%', background: '#475569' }} 
              disabled={submitting} 
              onClick={() => handleSave(true)}
            >
              暫存草稿 (不必完整填寫)
            </button>
          </div>
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
