export const TICKET_STATES = ['open', 'assigned', 'resolved', 'closed'] as const;

export function nextTicketState(current: string, next: string) {
  if (!TICKET_STATES.includes(current as (typeof TICKET_STATES)[number])) {
    throw new Error('Invalid ticket state');
  }
  return next;
}
