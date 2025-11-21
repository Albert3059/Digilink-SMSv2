import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import resend from "@/lib/resend"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Fetch all subscriptions expiring in the next 30 days
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select("*, admin_id, admins(email)")
      .lte("end_date", thirtyDaysFromNow.toISOString().split("T")[0])
      .gte("end_date", now.toISOString().split("T")[0])
      .eq("status", "active")

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ message: "No subscriptions to notify about" })
    }

    // Check for existing alerts to avoid duplicate notifications
    const alertIds = subscriptions.map((s) => s.id)

    const { data: existingAlerts } = await supabase
      .from("subscription_alerts")
      .select("subscription_id")
      .in("subscription_id", alertIds)
      .eq("alert_type", "expiry_warning")

    const alertedSubscriptions = new Set((existingAlerts || []).map((a) => a.subscription_id))

    const newNotifications = subscriptions.filter((s) => !alertedSubscriptions.has(s.id))

    const sentEmails = []
    const failedEmails = []

    // Send emails using Resend and create alert records
    for (const subscription of newNotifications) {
      try {
        const adminEmail = subscription.admins?.email || ""
        const daysUntilExpiry = Math.ceil(
          (new Date(subscription.end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        )

        const emailResult = await resend.emails.send({
          from: "Digilink IT Solutions <info@digilinkict.co.za>",
          to: adminEmail,
          subject: `Subscription Expiring Soon: ${subscription.client_name} (${daysUntilExpiry} days)`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="text-align: center; margin-bottom: 30px;">
                <img src="/images/fulllogo.png" alt="Digilink IT Solutions" style="max-width: 250px; height: auto;" />
              </div>
              <h2 style="color: #1e3a8a;">Subscription Expiring Soon</h2>
              <p>This subscription will expire within the next 30 days.</p>
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f97316;">
                <p><strong>Client:</strong> ${subscription.client_name}</p>
                <p><strong>Subscription Type:</strong> ${subscription.subscription_type}</p>
                <p><strong>Expires In:</strong> ${daysUntilExpiry} days</p>
                <p><strong>Expiry Date:</strong> ${new Date(subscription.end_date).toLocaleDateString()}</p>
                ${subscription.price ? `<p><strong>Price:</strong> $${subscription.price}</p>` : ""}
              </div>
              <p>Please log in to your subscription dashboard to review or renew this subscription.</p>
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #666; font-size: 12px;">
                <p>Connecting You to the Digital World</p>
              </div>
            </div>
          `,
        })

        if (emailResult.error) {
          failedEmails.push({
            subscription: subscription.client_name,
            reason: emailResult.error.message,
          })
        } else {
          // Create alert record only if email sent successfully
          await supabase.from("subscription_alerts").insert({
            subscription_id: subscription.id,
            alert_type: "expiry_warning",
          })

          sentEmails.push({
            admin: adminEmail,
            subscription: subscription.client_name,
            expiresOn: subscription.end_date,
          })

          console.log(`[EMAIL] Expiry warning sent to ${adminEmail} for ${subscription.client_name}`)
        }
      } catch (error) {
        failedEmails.push({
          subscription: subscription.client_name,
          reason: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    return NextResponse.json({
      message: "Alerts processed",
      sent: sentEmails.length,
      failed: failedEmails.length,
      sentEmails,
      failedEmails,
    })
  } catch (error) {
    console.error("Error sending alerts:", error)
    return NextResponse.json({ error: "Failed to send alerts" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Email notification service for subscription expiry warnings",
  })
}
