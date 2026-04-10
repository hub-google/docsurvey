import { NextResponse } from 'next/server';
import { getExcelData } from '@/lib/data';

export async function GET() {
  const { loginData, registrations } = await getExcelData();
  
  const totalUsers = loginData.length;
  const uniqueFilledUsers = new Set(registrations.map((r: any) => r.業務員代碼)).size;

  const regionalStats: Record<string, { total: number; filled: number }> = {};

  loginData.forEach((user: any) => {
    const region = user.區域中心;
    if (!regionalStats[region]) {
      regionalStats[region] = { total: 0, filled: 0 };
    }
    regionalStats[region].total++;
  });

  const filledUserCodes = new Set(registrations.map((r: any) => r.業務員代碼));
  loginData.forEach((user: any) => {
      if (filledUserCodes.has(user.業務員代碼)) {
          regionalStats[user.區域中心].filled++;
      }
  });

  return NextResponse.json({
    totalUsers,
    filledUsers: uniqueFilledUsers,
    overallRate: totalUsers > 0 ? (uniqueFilledUsers / totalUsers) * 100 : 0,
    regionalStats,
  });
}
