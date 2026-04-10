import { getExcelData, Registration } from '@/lib/data';
import PrintButton from './PrintButton';

export const dynamic = 'force-dynamic';

export default async function PrintReportPage() {
  const { registrations, memberData } = await getExcelData();

  if (!registrations || registrations.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        尚無任何報名資料可以列印
      </div>
    );
  }

  // Group by Office
  const offices = [...new Set(registrations.map((r: Registration) => r.通訊處))];

  return (
    <div style={{ backgroundColor: '#fff', color: '#000', fontSize: '12pt', padding: '0', margin: '0' }}>
      <style>{`
        body { background: white; margin: 0; padding: 0; }
        @media print {
          .page-break { page-break-after: always; }
          .no-print { display: none; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin: 1.5cm; }
        }
        .report-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
        .report-table th, .report-table td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        .report-table th { background-color: #f3f4f6; width: 150px; }
      `}</style>
      
      <div className="no-print" style={{ padding: '1rem', background: '#e5e7eb', textAlign: 'center', marginBottom: '2rem' }}>
        <p style={{ marginBottom: '1rem' }}>此頁面專為 PDF 列印設計。點擊下方按鈕後，請在印表機選擇「另存為 PDF」。</p>
        <PrintButton />
      </div>

      {offices.map((office, index) => {
        const officeRegs = registrations.filter((r: Registration) => r.通訊處 === office);
        
        return (
          <div key={office} className="page-break" style={{ padding: '2rem' }}>
            <h1 style={{ textAlign: 'center', fontSize: '24pt', marginBottom: '2rem', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
              醫師公會職域活化 報名資料
            </h1>
            <h2 style={{ fontSize: '18pt', marginBottom: '1.5rem', color: '#1f2937' }}>
              通訊處：{office}
            </h2>
            
            {officeRegs.map((reg, rIdx) => {
              const convenerCode = String(reg.總召業務員代碼 || '').trim();
              const convener = memberData.find(m => String(m.業務員代碼) === convenerCode || String(m.姓名).trim() === convenerCode);
              const convenerText = convener ? `${convener.姓名} (${convener.職級})` : convenerCode;
              
              // Resolve teams based on comma-separated code string
              const teamCodes = String(reg.團隊成員業務員代碼 || '').split(',').map(s => s.trim()).filter(Boolean);
              const teamText = teamCodes.map((code: string) => {
                  const m = memberData.find(mem => String(mem.業務員代碼) === code);
                  return m ? `${m.姓名} (${m.職級})` : code;
              }).join('、');

              // Extract time handling potential weird keys
              const timestampRaw = reg['選擇時間(YYYY/MM/DD HH:mm:SS)'] || reg.選擇時間 || '';
              const timeDisplay = timestampRaw ? new Date(timestampRaw).toLocaleString() : '無紀錄';

              return (
                <div key={rIdx} style={{ marginBottom: '3rem', pageBreakInside: 'avoid' }}>
                  <div style={{ background: '#f8fafc', padding: '10px', borderLeft: '4px solid #3b82f6', marginBottom: '1rem' }}>
                    <strong>填寫者：</strong> {reg.姓名} ({reg.業務員代碼})
                    <span style={{ float: 'right', color: '#64748b' }}>最後修改: {timeDisplay}</span>
                  </div>
                  
                  <table className="report-table">
                    <tbody>
                      <tr>
                        <th>包序號</th>
                        <td>{String(reg.包序號 || '')}</td>
                      </tr>
                      <tr>
                        <th>志願序</th>
                        <td>{String(reg.志願序 || '')}</td>
                      </tr>
                      <tr>
                        <th>推動規劃</th>
                        <td><div style={{ whiteSpace: 'pre-wrap' }}>{String(reg.推動規劃 || '')}</div></td>
                      </tr>
                      <tr>
                        <th>人員經營管理及跟催機制</th>
                        <td><div style={{ whiteSpace: 'pre-wrap' }}>{String(reg.人員經營管理及跟催機制 || '')}</div></td>
                      </tr>
                      <tr>
                        <th>經營目標</th>
                        <td><div style={{ whiteSpace: 'pre-wrap' }}>{String(reg.經營目標 || '')}</div></td>
                      </tr>
                      <tr>
                        <th>總召</th>
                        <td>{convenerText}</td>
                      </tr>
                      <tr>
                        <th>團隊成員</th>
                        <td>{teamText || '無'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        );
      })}
      
      {/* Auto-trigger print on client load for convenience, but we provided a button in case it gets blocked */}
      <script dangerouslySetInnerHTML={{ __html: 'setTimeout(function() { window.print(); }, 1000);' }} />
    </div>
  );
}
