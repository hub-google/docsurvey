export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getExcelData, Registration } from '@/lib/data';
import * as XLSX from 'xlsx';

export async function GET() {
  const { registrations, memberData } = await getExcelData();

  if (!registrations || registrations.length === 0) {
    return NextResponse.json({ message: '尚無報名資料' }, { status: 404 });
  }

  // Group by Office
  const offices = [...new Set(registrations.map((r: Registration) => r.通訊處))];

  const workbook = XLSX.utils.book_new();

  offices.forEach((office: string) => {
    const officeRegs = registrations.filter((r: Registration) => r.通訊處 === office);
    
    // Create rows for the worksheet following the template
    const rows: any[][] = [];

    officeRegs.forEach((reg: Registration) => {
      // Find member names for Convener and Team
      const convener = memberData.find(m => m.業務員代碼 === reg.總召業務員代碼);
      const convenerText = convener ? `${convener.姓名} (${convener.職級})` : reg.總召業務員代碼;
      
      const teamText = reg.團隊成員業務員代碼.map((code: string) => {
          const m = memberData.find(mem => mem.業務員代碼 === code);
          return m ? `${m.姓名} (${m.職級})` : code;
      }).join(', ');

      rows.push(['通訊處', office]);
      rows.push([]);
      rows.push(['包序號', reg.包序號, '志願序', reg.志願序]);
      rows.push([]);
      rows.push(['推動規劃']);
      rows.push([reg.推動規劃]);
      rows.push([]);
      rows.push(['人員經營管理及跟催機制']);
      rows.push([reg.人員經營管理及跟催機制]);
      rows.push([]);
      rows.push(['經營目標']);
      rows.push([reg.經營目標]);
      rows.push([]);
      rows.push(['總召']);
      rows.push([convenerText]);
      rows.push([]);
      rows.push(['團隊成員']);
      rows.push([teamText]);
      rows.push([]);
      rows.push(['--------------------------------------------------']);
      rows.push([]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, office.substring(0, 31)); // sheet names limited to 31 chars
  });

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="醫師公會職域活化_報名資料.xlsx"',
    },
  });
}
