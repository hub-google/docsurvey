import { NextResponse } from 'next/server';
import { saveRegistration, clearUserRegistrations } from '@/lib/data';
import { getSession } from '@/lib/session';

export async function POST(request: Request) {
  const user = getSession();
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { selections } = body;

  if (!selections || selections.length !== 3) {
    return NextResponse.json({ message: '必須勾選三項' }, { status: 400 });
  }

  // Check unique priorities
  const priorities = selections.map((s: any) => s.priority);
  const uniquePriorities = new Set(priorities);
  if (uniquePriorities.size !== 3 || !priorities.every((p: number) => [1, 2, 3].includes(p))) {
    return NextResponse.json({ message: '志願序必須為 1, 2, 3 且不能重複' }, { status: 400 });
  }

  // Clear previous registrations for this user 
  await clearUserRegistrations(user.業務員代碼);

  const timestamp = new Date().toLocaleString('zh-TW', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  }).replace(/\//g, '-');

  for (const sel of selections) {
    await saveRegistration({
      業務員代碼: user.業務員代碼,
      通訊處: user.通訊處,
      姓名: user.姓名,
      包序號: sel.packageId,
      志願序: sel.priority,
      推動規劃: sel.promoPlan,
      人員經營管理及跟催機制: sel.mgmtMechanism,
      經營目標: sel.target,
      總召業務員代碼: sel.convener,
      團隊成員業務員代碼: sel.teamMembers,
      選擇時間: timestamp,
    });
  }

  return NextResponse.json({ message: '提交成功' });
}
