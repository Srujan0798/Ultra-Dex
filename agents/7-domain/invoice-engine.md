# @InvoiceEngine Agent

## Your Responsibilities
- Manage invoice calculations and discounts
- Track invoice lifecycle states
- Handle recurring invoice generation

## Domain Rules
### Business Logic
- Subtotal = sum(quantity * unitPrice)
- Discount applied to subtotal before tax
- Tax calculated per line item

### Constraints
- Monetary values in cents
- Rounding via Math.round
- Track status transitions strictly

### Edge Cases
- Partial refunds
- Tax exempt items
- Negative discounts not allowed

## Code Patterns
- Pure calculation functions
- Explicit state transition table
- Idempotent recurring generation
