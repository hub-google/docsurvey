export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getExcelData, Registration } from '@/lib/data';
import * as XLSX from 'xlsx';

export async function GET() {
  const { registrations } = await getExcelData();

  if (!registrations || registrations.length === 0) {
    return NextResponse.json({ message: '尚無報名資料' }, { status: 404 });
  }

  const workbook = XLSX.utils.book_new();
  
  // Directly convert the raw sheet object array to an Excel sheet
  const worksheet = XLSX.utils.json_to_sheet(registrations);
  XLSX.utils.book_append_sheet(workbook, worksheet, '使用者選擇結果');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="醫師公會職域活化_報名資料.xlsx"',
    },
  });
}
