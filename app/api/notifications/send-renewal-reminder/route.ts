import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import resend from "@/lib/resend"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Fetch all subscriptions with renewal dates in the next 14 days
    const now = new Date()
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select("*, admin_id, admins(email)")
      .not("renewal_date", "is", null)
      .lte("renewal_date", twoWeeksFromNow.toISOString().split("T")[0])
      .gte("renewal_date", now.toISOString().split("T")[0])

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ message: "No renewals to remind about" })
    }

    // Check for existing alerts
    const alertIds = subscriptions.map((s) => s.id)

    const { data: existingAlerts } = await supabase
      .from("subscription_alerts")
      .select("subscription_id")
      .in("subscription_id", alertIds)
      .eq("alert_type", "renewal_reminder")

    const alertedSubscriptions = new Set((existingAlerts || []).map((a) => a.subscription_id))

    const newReminders = subscriptions.filter((s) => !alertedSubscriptions.has(s.id))

    const sentEmails = []
    const failedEmails = []

    // Send emails using Resend and create alert records
    for (const subscription of newReminders) {
      try {
        const adminEmail = subscription.admins?.email || ""
        const daysUntilRenewal = Math.ceil(
          (new Date(subscription.renewal_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        )

        const emailResult = await resend.emails.send({
          from: "Digilink IT Solutions <info@digilinkict.co.za>",
          to: adminEmail,
          subject: `Subscription Renewal Reminder: ${subscription.client_name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="text-align: center; margin-bottom: 30px;">
                <img src="/images/fulllogo.png" alt="Digilink IT Solutions" style="max-width: 250px; height: auto;" />
              </div>
              <h2 style="color: #1e3a8a;">Subscription Renewal Reminder</h2>
              <p>A subscription renewal is coming up soon.</p>
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                <p><strong>Client:</strong> ${subscription.client_name}</p>
                <p><strong>Subscription Type:</strong> ${subscription.subscription_type}</p>
                <p><strong>Renewal In:</strong> ${daysUntilRenewal} days</p>
                <p><strong>Renewal Date:</strong> ${subscription.renewal_date}</p>
                ${subscription.price ? `<p><strong>Price:</strong> $${subscription.price}</p>` : ""}
              </div>
              <p>Please log in to your subscription dashboard to confirm or update the renewal details.</p>
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
            alert_type: "renewal_reminder",
          })

          sentEmails.push({
            admin: adminEmail,
            subscription: subscription.client_name,
            renewalOn: subscription.renewal_date,
          })

          console.log(`[EMAIL] Renewal reminder sent to ${adminEmail} for ${subscription.client_name}`)
        }
      } catch (error) {
        failedEmails.push({
          subscription: subscription.client_name,
          reason: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    return NextResponse.json({
      message: "Renewal reminders processed",
      sent: sentEmails.length,
      failed: failedEmails.length,
      sentEmails,
      failedEmails,
    })
  } catch (error) {
    console.error("Error sending reminders:", error)
    return NextResponse.json({ error: "Failed to send reminders" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Email notification service for subscription renewal reminders",
  })
}
