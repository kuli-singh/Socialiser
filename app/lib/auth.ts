
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { redirect } from 'next/navigation';

export async function getRequiredSession() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect('/login');
  }
  
  return session;
}

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user || null;
}

export function requireAuth<T extends (...args: any[]) => any>(handler: T): T {
  return (async (...args: any[]) => {
    const session = await getRequiredSession();
    return handler(...args);
  }) as T;
}
