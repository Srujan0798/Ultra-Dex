/**
 * @fileoverview Ticket Workflow module
 * @module supportdesk/ticket-workflow
 */

export const TICKET_STATES = ['open', 'assigned', 'resolved', 'closed'] as const;

export function nextTicketState(current: string, next: string) {
  if (!TICKET_STATES.includes(current as (typeof TICKET_STATES)[number])) {
    throw new Error('Invalid ticket state');
  }
  return next;
}

/**
 * Error handler for ticket-workflow
 * @param {Error} error - Error to handle
 */
function handleTicketworkflowError(error) {
  try {
    console.error('[ticket-workflow]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
