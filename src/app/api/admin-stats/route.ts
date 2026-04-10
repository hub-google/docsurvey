import { NextResponse } from 'next/server';
import { getExcelData, getRegistrations } from '@/lib/data';

export async function GET() {
  const { loginData } = await getExcelData();
  const registrations = await getRegistrations();

  const totalUsers = loginData.length;
  const uniqueFilledUsers = new Set(registrations.map((r) => r.業務員代碼)).size;

  const regionalStats: Record<string, { total: number; filled: number }> = {};

  loginData.forEach((user) => {
    const region = user.區域中心;
    if (!regionalStats[region]) {
      regionalStats[region] = { total: 0, filled: 0 };
    }
    regionalStats[region].total++;
  });

  const filledUserCodes = new Set(registrations.map(r => r.業務員代碼));
  loginData.forEach(user => {
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
