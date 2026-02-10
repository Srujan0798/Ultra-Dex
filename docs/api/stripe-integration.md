# Stripe Integration Guide

The Ultra-Dex Stripe integration enables seamless payment processing, subscription management, and financial reporting within your development workflow.

## Setup

### Prerequisites
- Stripe account with API access
- Publishable key and secret key
- Webhook endpoint for event handling

### Configuration
```bash
# Set your Stripe API keys
ultra-dex config set STRIPE_PUBLISHABLE_KEY pk_test_...
ultra-dex config set STRIPE_SECRET_KEY sk_test_...
ultra-dex config set STRIPE_WEBHOOK_SECRET whsec_...
```

### Environment Variables
```env
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret
```

## Features

### Customer Management
```bash
# Create a new customer
ultra-dex stripe customer create --email user@example.com --name "John Doe"

# Retrieve customer details
ultra-dex stripe customer get --id cus_12345

# Update customer information
ultra-dex stripe customer update --id cus_12345 --email newemail@example.com
```

### Subscription Management
```bash
# Create a subscription
ultra-dex stripe subscription create --customer-id cus_12345 --price-id price_12345

# List active subscriptions
ultra-dex stripe subscription list --status active

# Cancel a subscription
ultra-dex stripe subscription cancel --id sub_12345
```

### Payment Processing
```bash
# Process a one-time payment
ultra-dex stripe payment create --amount 1000 --currency usd --customer-id cus_12345

# Refund a payment
ultra-dex stripe refund create --payment-id pay_12345 --amount 500
```

### Product & Pricing
```bash
# Create a product
ultra-dex stripe product create --name "Premium Plan" --description "Access to premium features"

# Create a price for the product
ultra-dex stripe price create --product-id prod_12345 --unit-amount 2999 --currency usd --recurring interval=month
```

## Webhook Handling

The Stripe integration automatically handles common webhook events:

- `invoice.payment_succeeded` - Payment received successfully
- `invoice.payment_failed` - Payment failed, needs attention
- `customer.subscription.created` - New subscription started
- `customer.subscription.updated` - Subscription modified
- `customer.subscription.deleted` - Subscription cancelled

Configure your webhook endpoint:
```bash
ultra-dex stripe webhook configure --endpoint https://yourdomain.com/webhooks/stripe
```

## CLI Commands

### Main Stripe Commands
- `ultra-dex stripe customer` - Manage customers
- `ultra-dex stripe subscription` - Manage subscriptions
- `ultra-dex stripe payment` - Process payments
- `ultra-dex stripe refund` - Handle refunds
- `ultra-dex stripe product` - Manage products
- `ultra-dex stripe price` - Manage pricing
- `ultra-dex stripe webhook` - Configure webhooks

### Examples

Create a recurring billing setup:
```bash
# Create a product
PRODUCT_ID=$(ultra-dex stripe product create --name "Pro Plan" --description "Professional tier" | jq -r '.id')

# Create a monthly price
PRICE_ID=$(ultra-dex stripe price create --product-id $PRODUCT_ID --unit-amount 2999 --currency usd --recurring interval=month | jq -r '.id')

# Create a customer
CUSTOMER_ID=$(ultra-dex stripe customer create --email user@example.com --name "Jane Doe" | jq -r '.id')

# Subscribe the customer to the plan
ultra-dex stripe subscription create --customer-id $CUSTOMER_ID --price-id $PRICE_ID
```

## Error Handling

The integration includes robust error handling:

- Network timeouts with retry logic
- Invalid API key detection
- Rate limiting with exponential backoff
- Detailed error messages with remediation suggestions

## Monitoring & Logging

All Stripe operations are logged in the Ultra-Dex ledger:
```bash
# View recent Stripe operations
ultra-dex ledger view --service stripe --last 10

# Monitor Stripe webhook health
ultra-dex stripe health check
```

## Best Practices

1. **Secure Key Storage**: Store API keys in environment variables or secure vault
2. **Webhook Verification**: Always verify webhook signatures
3. **Idempotency**: Use idempotency keys for important operations
4. **Testing**: Use test keys during development
5. **Monitoring**: Set up alerts for failed payments or webhook delivery issues