import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendWelcomeEmail = async (email: string, name?: string) => {
  return resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: email,
    subject: 'Welcome to our SaaS!',
    html: `
      <h1>Welcome ${name || 'there'}!</h1>
      <p>Thanks for signing up. We're excited to have you on board.</p>
    `,
  });
};

export const sendInvoiceEmail = async (email: string, invoiceId: string, amount: number) => {
  return resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: email,
    subject: 'Your invoice is ready',
    html: `
      <h1>Invoice #${invoiceId}</h1>
      <p>Amount: $${(amount / 100).toFixed(2)}</p>
      <p>Thank you for your business!</p>
    `,
  });
};
