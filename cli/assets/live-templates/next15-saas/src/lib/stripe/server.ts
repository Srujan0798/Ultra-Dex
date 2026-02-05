import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-04-10',
})

export const getOrCreateCustomer = async (userId: string, email: string) => {
    const { db } = await import('@/lib/db')

    const existing = await db.subscription.findUnique({
        where: { userId },
        select: { stripeCustomerId: true },
    })

    if (existing?.stripeCustomerId) {
        return existing.stripeCustomerId
    }

    const customer = await stripe.customers.create({
        email,
        metadata: { userId },
    })

    await db.subscription.create({
        data: {
            userId,
            stripeCustomerId: customer.id,
            status: 'INCOMPLETE',
            plan: 'FREE',
        },
    })

    return customer.id
}

export const createCheckoutSession = async (customerId: string, priceId: string) => {
    return stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        billing_address_collection: 'auto',
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?canceled=true`,
    })
}
