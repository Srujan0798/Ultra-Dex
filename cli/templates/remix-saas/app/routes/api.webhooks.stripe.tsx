import type { ActionFunctionArgs } from '@remix-run/node'
import { json } from '@remix-run/node'
import { stripe } from '~/lib/payments/stripe.server'
import { db } from '~/lib/db.server'

export const action = async ({ request }: ActionFunctionArgs) => {
    const payload = await request.text()
    const sig = request.headers.get('stripe-signature')!

    let event

    try {
        event = stripe.webhooks.constructEvent(
            payload,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET!
        )
    } catch (err) {
        console.error('Webhook signature verification failed:', err)
        return json({ error: 'Invalid signature' }, { status: 400 })
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
                },
            })
            break
        }

        case 'customer.subscription.updated': {
            const subscription = event.data.object
            const customerId = subscription.customer as string

            await db.subscription.update({
                where: { stripeCustomerId: customerId },
                data: {
                    status: subscription.status.toUpperCase() as any,
                    currentPeriodStart: new Date(subscription.current_period_start * 1000),
                    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                },
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
                },
            })
            break
        }
    }

    return json({ received: true })
}
