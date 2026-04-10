export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getExcelData } from '@/lib/data';
import { getSession } from '@/lib/session';

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { packageData, memberData } = await getExcelData();

  // Filter packages by user's regional center
  const filteredPackages = packageData.filter(
    (p) => p.可選擇的區域中心 === user.區域中心
  );

  // Filter members by user's office
  const filteredMembers = memberData.filter(
    (m) => m.通訊處 === user.通訊處
  );

  return NextResponse.json({
    user,
    packages: filteredPackages,
    members: filteredMembers,
  });
}
