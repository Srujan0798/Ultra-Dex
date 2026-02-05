import Stripe from 'stripe'
import { STRIPE_SECRET_KEY } from '$env/static/private'

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2024-04-10',
})

export const createCheckoutSession = async (customerId: string, priceId: string) => {
    return stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        billing_address_collection: 'auto',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${process.env.PUBLIC_APP_URL}/dashboard?success=true`,
        cancel_url: `${process.env.PUBLIC_APP_URL}/dashboard?canceled=true`,
    })
}
