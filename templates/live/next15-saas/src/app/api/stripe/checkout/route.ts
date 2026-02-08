import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createCheckoutSession, getOrCreateCustomer } from '@/lib/stripe/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { priceId } = await req.json();

  if (!priceId) {
    return NextResponse.json({ error: 'Price ID required' }, { status: 400 });
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, email: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  try {
    const customerId = await getOrCreateCustomer(user.id, user.email);
    const session = await createCheckoutSession(customerId, priceId);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
