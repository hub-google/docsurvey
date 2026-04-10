import { NextResponse } from 'next/server';
import { saveAllSelections, clearUserRegistrations } from '@/lib/data';
import { getSession } from '@/lib/session';

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { selections, isDraft } = body;

  if (!selections || selections.length === 0) {
    return NextResponse.json({ message: '無效的資料格式' }, { status: 400 });
  }

  // Batch save all selections via GAS Bridge
  const enrichedSelections = selections.map((s: any) => ({
    ...s,
    業務員代碼: user.業務員代碼,
    通訊處: user.通訊處,
    姓名: user.姓名
  }));

  await saveAllSelections(user.業務員代碼, enrichedSelections);

  return NextResponse.json({ message: isDraft ? '草稿儲存成功' : '提交成功' });
}
