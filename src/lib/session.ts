import { cookies } from 'next/headers';
import { User } from './data';

export function getSession(): User | null {
  const cookieStore = cookies();
  const session = cookieStore.get('user_session');
  if (!session) return null;
  try {
    return JSON.parse(session.value);
  } catch (e) {
    return null;
  }
}
