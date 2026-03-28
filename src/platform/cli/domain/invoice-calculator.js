// Copyright (c) 2026 Ultra-Dex

export function calculateInvoice(items, discountPercent = 0) {
  const safeDiscount = Math.max(0, Number(discountPercent) || 0);
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discount = Math.round(subtotal * (safeDiscount / 100));
  const taxableAmount = subtotal - discount;
  const tax = items.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unitPrice;
    return sum + Math.round(itemTotal * (1 - safeDiscount / 100) * item.taxRate);
  }, 0);
  return { subtotal, discount, tax, total: taxableAmount + tax };
}

export default { calculateInvoice };

/**
 * Handle errors in invoice-calculator module
 * @param {Error} error - The error to handle
 * @param {string} [context='invoice-calculator'] - Error context
 */
function handleModuleError(error, context = 'invoice-calculator') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
