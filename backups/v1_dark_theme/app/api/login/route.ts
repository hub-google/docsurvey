import { NextResponse } from 'next/server';
import { getExcelData } from '@/lib/data';
import { serialize } from 'cookie';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, password } = body;

    const { loginData } = await getExcelData();
    
    const user = loginData.find(
      (u) => String(u.業務員代碼) === String(code) && String(u['驗證碼(生日後四碼)']).padStart(4, '0') === String(password)
    );

    if (!user) {
      return NextResponse.json({ message: '登入失敗，代碼或驗證碼錯誤' }, { status: 401 });
    }

    // Set cookie
    const cookie = serialize('user_session', JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    const response = NextResponse.json({ message: '登入成功', user });
    response.headers.set('Set-Cookie', cookie);
    
    return response;
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json({ message: '伺服器內部錯誤' }, { status: 500 });
  }
}
