// Copyright (c) 2026 Ultra-Dex

const STATES = ['draft', 'sent', 'viewed', 'paid', 'overdue', 'void'];

const TRANSITIONS = {
  draft: ['sent', 'void'],
  sent: ['viewed', 'paid', 'overdue', 'void'],
  viewed: ['paid', 'overdue', 'void'],
  overdue: ['paid', 'void'],
  paid: [],
  void: [],
};

export function canTransition(from, to) {
  return (TRANSITIONS[from] || []).includes(to);
}

export function transitionInvoiceStatus(current, next) {
  if (!STATES.includes(current)) throw new Error(`Unknown state: ${current}`);
  if (!STATES.includes(next)) throw new Error(`Unknown state: ${next}`);
  if (!canTransition(current, next)) {
    throw new Error(`Invalid transition: ${current} -> ${next}`);
  }
  return next;
}

export function shouldGenerateRecurring(invoice) {
  if (!invoice?.recurring || !invoice?.nextGenerationDate) return false;
  const next = new Date(invoice.nextGenerationDate).getTime();
  return next <= Date.now();
}

export function generateRecurringInvoice(template) {
  const now = new Date().toISOString();
  return {
    ...template,
    id: `inv_${Date.now()}`,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };
}

export default {
  transitionInvoiceStatus,
  shouldGenerateRecurring,
  generateRecurringInvoice,
};
