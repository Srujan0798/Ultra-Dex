import { getServerSession } from 'next-auth';

export async function requireSession() {
  const session = await getServerSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}
