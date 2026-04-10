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
      <div className="glass" style={{ padding: '2.5rem', marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', borderLeft: '6px solid var(--primary)' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{data.user.姓名} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400 }}>({data.user.業務員代碼})</span></h2>
          <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{data.user.區域中心} <span style={{ margin: '0 0.5rem', opacity: 0.3 }}>|</span> {data.user.通訊處}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => router.push('/login')} className="btn-primary" style={{ background: '#64748b', fontSize: '0.9rem', padding: '10px 20px' }}>登出系統</button>
        </div>
      </div>

      <div className="glass" style={{ padding: '2.5rem', marginBottom: '3rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📝</span> 志願序選擇
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>請勾選三個報名項目並按優先順序排列 (點選編號可查看職域詳情)</p>
        </div>

        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
                <th style={{ padding: '1.25rem 1rem' }}>選擇</th>
                <th style={{ padding: '1.25rem 1rem' }}>包序號</th>
                <th style={{ padding: '1.25rem 1rem' }}>建議團隊人數</th>
                <th style={{ padding: '1.25rem 1rem' }}>志願序</th>
                <th style={{ padding: '1.25rem 1rem' }}>包含職域數</th>
              </tr>
            </thead>
            <tbody>
              {groupedPackages.map((pkg: any) => (
                <tr key={pkg.包序號} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(String(pkg.包序號))}
                        onChange={() => togglePackage(pkg.包序號)}
                      />
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <button 
                      onClick={() => setModalPackage(pkg)} 
                      style={{ background: 'rgba(37, 99, 235, 0.05)', color: 'var(--primary)', padding: '6px 12px', borderRadius: '8px', fontWeight: 700, fontSize: '0.9rem' }}
                    >
                      {pkg.包序號}
                    </button>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{pkg.建議經營團隊人數} 人</td>
                  <td style={{ padding: '1rem' }}>
                    <select 
                      disabled={!selectedIds.includes(String(pkg.包序號))}
                      value={priorityMap[String(pkg.包序號)] || ''}
                      onChange={(e) => updatePriority(pkg.包序號, e.target.value)}
                      style={{ padding: '8px 12px', width: '120px', background: !selectedIds.includes(String(pkg.包序號)) ? '#f1f5f9' : 'white' }}
                    >
                      <option value="">請選擇</option>
                      <option value="1">第一志願</option>
                      <option value="2">第二志願</option>
                      <option value="3">第三志願</option>
                    </select>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{pkg.items.length} 個職域</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="fade-in">
        <div className="glass" style={{ padding: '2.5rem', marginBottom: '3rem' }}>
          <h4 style={{ marginBottom: '2rem', borderLeft: '4px solid var(--primary)', paddingLeft: '1rem', fontSize: '1.25rem', fontWeight: 700 }}>報名資訊與經營計劃</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.95rem', color: '#334155' }}>一、推動規劃</label>
              <textarea rows={4} placeholder="請簡述您的推動規劃..." value={details.promoPlan} onChange={e => updateDetail('promoPlan', e.target.value)} style={{ width: '100%', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.95rem', color: '#334155' }}>二、人員經營管理及跟催機制</label>
              <textarea rows={4} placeholder="請說明人員管理與跟催機制..." value={details.mgmtMechanism} onChange={e => updateDetail('mgmtMechanism', e.target.value)} style={{ width: '100%', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.95rem', color: '#334155' }}>三、經營目標</label>
              <textarea rows={4} placeholder="請設定量化或質化之經營目標..." value={details.target} onChange={e => updateDetail('target', e.target.value)} style={{ width: '100%', resize: 'vertical' }} />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{ fontWeight: 600, fontSize: '0.95rem', color: '#334155' }}>總召 (限通訊處同仁)</label>
                <select value={details.convener} onChange={e => updateDetail('convener', e.target.value)} style={{ width: '100%', padding: '14px' }}>
                  <option value="">-- 請選擇總召人員 --</option>
                  {data.members.map((m: any) => (
                    <option key={m.業務員代碼} value={m.業務員代碼}>{m.姓名} ({m.職級})</option>
                  ))}
                </select>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{ fontWeight: 600, fontSize: '0.95rem', color: '#334155' }}>團隊成員 (可多選)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '300px', overflowY: 'auto', padding: '0.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  {data.members.map((m: any) => (
                    <label key={m.業務員代碼} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', transition: 'all 0.2s', background: details.teamMembers.includes(String(m.業務員代碼)) ? 'rgba(37, 99, 235, 0.08)' : 'transparent' }}>
                      <input type="checkbox" checked={details.teamMembers.includes(String(m.業務員代碼))} onChange={e => {
                        const next = e.target.checked ? [...details.teamMembers, String(m.業務員代碼)] : details.teamMembers.filter(c => c !== String(m.業務員代碼));
                        updateDetail('teamMembers', next);
                      }} />
                      <span>{m.姓名} <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>({m.職級})</span></span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ textAlign: 'center', paddingBottom: '6rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          {error && (
            <div style={{ color: '#b91c1c', padding: '1rem 2rem', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px', fontSize: '0.95rem', fontWeight: 500 }} className="fade-in">
              ⚠️ {error}
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '500px', flexDirection: 'column' }}>
            <button 
              className="btn-primary" 
              style={{ fontSize: '1.1rem', padding: '16px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} 
              disabled={submitting} 
              onClick={() => handleSave(false)}
            >
              {submitting ? '處理中...' : '🚀 正式送出報名資料'}
            </button>

            <button 
              className="btn-primary" 
              style={{ fontSize: '1rem', padding: '14px', width: '100%', background: '#64748b', opacity: 0.9 }} 
              disabled={submitting} 
              onClick={() => handleSave(true)}
            >
              💾 暫存目前的填寫進度
            </button>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>* 提交成功後，您的資料將會覆蓋前次紀錄</p>
        </div>
      </div>

      {modalPackage && (
        <div className="modal-overlay" onClick={() => setModalPackage(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '0.25rem' }}>包序號 {modalPackage.包序號} 詳情</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>共包含 {modalPackage.items.length} 個職域據點</p>
              </div>
              <button onClick={() => setModalPackage(null)} style={{ background: '#f1f5f9', color: '#64748b', fontSize: '1.5rem', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>&times;</button>
            </div>
            <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', background: '#f8fafc' }}>
                    {Object.keys(modalPackage.items[0]).filter(key => key !== 'items').slice(3).map(key => (
                      <th key={key} style={{ padding: '1rem', whiteSpace: 'nowrap' }}>{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modalPackage.items.map((it: any, i: number) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      {Object.keys(it).filter(key => key !== 'items').slice(3).map(k => (
                        <td key={k} style={{ padding: '1rem' }}>{String(it[k] || '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '2.5rem', textAlign: 'right' }}>
              <button className="btn-primary" onClick={() => setModalPackage(null)} style={{ padding: '10px 30px' }}>關閉視窗</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
