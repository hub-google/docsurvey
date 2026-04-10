import { NextResponse } from 'next/server';
import { saveAllSelections, clearUserRegistrations } from '@/lib/data';
import { getSession } from '@/lib/session';

export async function POST(request: Request) {
  const user = await getSession();
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

  // Batch save all selections via GAS Bridge
  const enrichedSelections = selections.map((s: any) => ({
    ...s,
    業務員代碼: user.業務員代碼,
    通訊處: user.通訊處,
    姓名: user.姓名
  }));

  await saveAllSelections(user.業務員代碼, enrichedSelections);

  return NextResponse.json({ message: '提交成功' });
}
