import type { NextApiRequest, NextApiResponse } from "next";
import { getResend } from "../../../lib/resend";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Server-side only vars
  const resendKeyPresent = !!process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM || "Digilink IT Solutions <info@digilinkict.co.za>";

  if (!resendKeyPresent) {
    console.error("[pages/api] RESEND_API_KEY is not configured")
    return res.status(500).json({ error: "Email service not configured" });
  }

  const { subscriptions, adminEmail, companyName } = req.body || {};

  if (!subscriptions || !Array.isArray(subscriptions)) {
    console.error("[pages/api] Invalid subscriptions data")
    return res.status(400).json({ error: "Invalid subscriptions data" });
  }

  if (!adminEmail) {
    console.error("[pages/api] No admin email provided")
    return res.status(400).json({ error: "Admin email is required" });
  }

  const resend = getResend();
  if (!resend) {
    console.error("[pages/api] getResend returned null despite env var check")
    return res.status(500).json({ error: "Email service not configured" });
  }

  // Generate a simple HTML report (keeps same structure as app router implementation)
  const totalSubscriptions = subscriptions.length;
  const activeSubscriptions = subscriptions.filter((s: any) => s.status === "active").length;
  const expiredSubscriptions = subscriptions.filter((s: any) => s.status === "expired").length;
  const totalRevenue = subscriptions.reduce((sum: number, s: any) => sum + (Number.parseFloat(s.price) || 0), 0);

  const today = new Date();
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  const upcomingRenewals = subscriptions.filter((sub: any) => {
    if (!sub.renewal_date) return false;
    const renewalDate = new Date(sub.renewal_date);
    return renewalDate >= today && renewalDate <= thirtyDaysFromNow;
  });

  const reportHtml = `<!doctype html><html><head><meta charset="utf-8"><title>Subscription Report</title></head><body><h1>Subscription Report</h1><p>${companyName || "Digilink IT Solutions"}</p><p>Generated on ${new Date().toLocaleDateString()}</p><p>Total: ${totalSubscriptions}</p><p>Active: ${activeSubscriptions}</p><p>Expired: ${expiredSubscriptions}</p><p>Total Revenue: $${totalRevenue.toFixed(2)}</p><h2>Upcoming Renewals</h2>${upcomingRenewals.length>0? '<ul>'+upcomingRenewals.map((r:any)=>`<li>${r.client_name} - ${r.subscription_type} - ${new Date(r.renewal_date).toLocaleDateString()} - $${Number.parseFloat(r.price).toFixed(2)}</li>`).join('')+'</ul>':'<p>No upcoming renewals</p>'}</body></html>`;

  try {
    const result = await resend.emails.send({
      from: emailFrom,
      to: adminEmail,
      subject: `Subscription Report - ${new Date().toLocaleDateString()}`,
      html: reportHtml,
    });

    console.log('[pages/api] Email sent, id=', (result as any)?.id || 'unknown');
    return res.status(200).json({ message: 'Report sent successfully', emailId: (result as any)?.id });
  } catch (err: any) {
    console.error('[pages/api] Error sending email:', err?.message || err);
    return res.status(500).json({ error: `Email service error: ${err?.message || 'Unknown error'}` });
  }
}
