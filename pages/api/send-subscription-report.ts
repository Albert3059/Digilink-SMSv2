import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const { RESEND_API_KEY, EMAIL_FROM } = process.env;

  if (!RESEND_API_KEY) {
    console.error('[pages/api/send-subscription-report] RESEND_API_KEY not set')
    return res.status(500).json({ message: 'Email service not configured' });
  }

  const { subscriptions = [], adminEmail } = req.body || {};

  if (!Array.isArray(subscriptions)) {
    return res.status(400).json({ message: 'Invalid subscriptions payload' });
  }

  // Helper that calls Resend REST API
  async function sendEmail(to: string, subject: string, html: string) {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM || 'Digilink IT Subscription Management System <info@digilinkict.co.za>',
        to,
        subject,
        html,
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`Resend API error: ${resp.status} ${txt}`);
    }

    return resp.json();
  }

  // If adminEmail was supplied, send a single aggregated report to admin
  if (adminEmail) {
    const total = subscriptions.length;
    const html = `<p>Subscription report for ${total} subscriptions.</p>`;
    try {
      const result = await sendEmail(adminEmail, 'Subscription Report', html);
      return res.status(200).json({ message: 'Report sent successfully', result });
    } catch (err: any) {
      console.error('[pages/api/send-subscription-report] Error sending to admin', err?.message || err);
      return res.status(500).json({ message: 'Error sending report', error: err?.message || String(err) });
    }
  }

  // Otherwise send to each subscription entry that has an email
  const errors: Array<any> = [];
  for (const sub of subscriptions) {
    if (!sub?.email) continue;
    const html = `<p>Hello ${sub.name || sub.client_name || 'Customer'},</p><p>This is your subscription notification.</p>`;
    try {
      await sendEmail(sub.email, 'Subscription Notification', html);
    } catch (err: any) {
      errors.push({ email: sub.email, error: err?.message || String(err) });
    }
  }

  if (errors.length > 0) return res.status(500).json({ message: 'Some emails failed', errors });
  return res.status(200).json({ message: 'Emails sent' });
}
