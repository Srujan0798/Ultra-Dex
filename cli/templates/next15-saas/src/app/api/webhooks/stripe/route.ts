import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'
import { db } from '@/lib/db'

export async function POST(req: Request) {
    const body = await req.text()
    const sig = headers().get('stripe-signature')!

    let event

    try {
        event = stripe.webhooks.constructEvent(
            body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET!
        )
    } catch (err) {
        console.error('Webhook signature verification failed:', err)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object
            const customerId = session.customer as string
            const subscriptionId = session.subscription as string

            await db.subscription.update({
                where: { stripeCustomerId: customerId },
                data: {
                    stripeSubscriptionId: subscriptionId,
                    status: 'ACTIVE',
                    plan: 'PRO',
                }
            })
            break
        }

        case 'customer.subscription.updated': {
            const subscription = event.data.object
            const customerId = subscription.customer as string

            const planMap: Record<string, 'FREE' | 'PRO' | 'ENTERPRISE'> = {
                'price_free': 'FREE',
                'price_pro': 'PRO',
                'price_enterprise': 'ENTERPRISE',
            }

            await db.subscription.update({
                where: { stripeCustomerId: customerId },
                data: {
                    status: subscription.status.toUpperCase() as any,
                    plan: planMap[subscription.items.data[0]?.price.id] || 'FREE',
                    currentPeriodStart: new Date(subscription.current_period_start * 1000),
                    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                }
            })
            break
        }

        case 'customer.subscription.deleted': {
            const subscription = event.data.object
            const customerId = subscription.customer as string

            await db.subscription.update({
                where: { stripeCustomerId: customerId },
                data: {
                    status: 'CANCELED',
                    plan: 'FREE',
                }
            })
            break
        }

        case 'invoice.paid': {
            const invoice = event.data.object
            const customerId = invoice.customer as string

            const sub = await db.subscription.findUnique({
                where: { stripeCustomerId: customerId },
                select: { userId: true }
            })

            if (sub) {
                await db.invoice.create({
                    data: {
                        userId: sub.userId,
                        stripeInvoiceId: invoice.id,
                        amount: invoice.amount_paid,
                        currency: invoice.currency,
                        status: 'PAID',
                        description: invoice.description || 'Subscription payment',
                        paidAt: new Date(),
                    }
                })
            }
            break
        }
    }

    return NextResponse.json({ received: true })
}
