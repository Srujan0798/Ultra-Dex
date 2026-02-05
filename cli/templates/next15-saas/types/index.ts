export interface User {
    id: string;
    clerkId: string;
    email: string;
    name?: string;
    role: 'USER' | 'ADMIN';
    createdAt: Date;
    updatedAt: Date;
}

export interface Subscription {
    id: string;
    userId: string;
    stripeCustomerId: string;
    stripeSubscriptionId?: string;
    status: 'INCOMPLETE' | 'INCOMPLETE_EXPIRED' | 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNPAID' | 'PAUSED';
    plan: 'FREE' | 'PRO' | 'ENTERPRISE';
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface Invoice {
    id: string;
    userId: string;
    stripeInvoiceId?: string;
    amount: number;
    currency: string;
    status: 'DRAFT' | 'OPEN' | 'PAID' | 'UNCOLLECTIBLE' | 'VOID';
    description?: string;
    paidAt?: Date;
    createdAt: Date;
}

export interface Feature {
    id: string;
    name: string;
    description?: string;
    key: string;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Usage {
    id: string;
    userId: string;
    feature: string;
    count: number;
    month: number;
    year: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface PricingPlan {
    id: string;
    name: string;
    description: string;
    price: number;
    priceId: string;
    features: string[];
    popular?: boolean;
}
