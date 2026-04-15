import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, company, teamSize, message } = req.body || {};

  if (!name || !email || !company || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const payload = {
    name,
    email,
    company,
    teamSize: teamSize || 'unknown',
    message,
    submittedAt: new Date().toISOString(),
    source: 'enterprise-page',
  };

  // Log to server output (visible in Vercel logs or terminal)
  console.log('[Enterprise Lead]', JSON.stringify(payload));

  // Optional: forward to an email webhook if configured
  if (process.env.CONTACT_WEBHOOK_URL) {
    try {
      await fetch(process.env.CONTACT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      // Non-blocking: log success is enough for MVP
    }
  }

  return res.status(200).json({ success: true });
}
