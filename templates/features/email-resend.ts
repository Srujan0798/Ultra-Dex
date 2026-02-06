// Resend Email Template (React Email + BullMQ)

import React from 'react';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || '');

export async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string;
  subject: string;
  react: React.ReactElement;
}) {
  return resend.emails.send({
    from: 'Ultra-Dex <noreply@ultra-dex.dev>',
    to,
    subject,
    react,
  });
}

export const emailRateLimiter = {
  windowMs: 60_000,
  max: 50,
  key: (userId: string) => `email:${userId}`,
};

export function WelcomeEmail({ name }: { name: string }) {
  return React.createElement(
    'div',
    null,
    React.createElement('h1', null, `Welcome, ${name}`),
    React.createElement('p', null, 'Your workspace is ready.')
  );
}

export function PasswordResetEmail({ url }: { url: string }) {
  return React.createElement(
    'div',
    null,
    React.createElement('h1', null, 'Reset your password'),
    React.createElement('p', null, 'Click the link below to reset your password.'),
    React.createElement('a', { href: url }, 'Reset Password')
  );
}
