import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import resend from "@/lib/resend"

// Alert thresholds in days
const ALERT_THRESHOLDS = [60, 30, 14, 7]

export async function POST(request: Request) {
  try {
    // Verify the request has the correct authorization header (if you want to secure it)
    const authHeader = request.headers.get("authorization")
    const expectedKey = process.env.CRON_SECRET_KEY || "default-dev-key"

    if (authHeader !== `Bearer ${expectedKey}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()

    const now = new Date()
    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      alerts: [] as any[],
    }

    // Check each threshold
    for (const days of ALERT_THRESHOLDS) {
      const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
      const alertDate = futureDate.toISOString().split("T")[0]

      // Fetch subscriptions expiring on or near the target date
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("*, admins(email, company_name)")
        .eq("status", "active")
        .eq("end_date", alertDate)

      if (!subscriptions || subscriptions.length === 0) {
        continue
      }

      // Check for existing alerts to avoid duplicates
      for (const subscription of subscriptions) {
        const alertType = `renewal_reminder_${days}d`

        const { data: existingAlert } = await supabase
          .from("subscription_alerts")
          .select("id")
          .eq("subscription_id", subscription.id)
          .eq("alert_type", alertType)
          .single()

        // Skip if alert already sent
        if (existingAlert) {
          continue
        }

        try {
          const adminEmail = subscription.admins?.email || ""
          const companyName = subscription.admins?.company_name || "Your Company"

          // Send email
          const emailResult = await resend.emails.send({
            from: "Digilink IT Solutions <info@digilinkict.co.za>",
            to: adminEmail,
            subject: `Renewal Alert: ${subscription.client_name} subscription renewing in ${days} days`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <img src="/images/fulllogo.png" alt="Digilink IT Solutions" style="max-width: 250px; height: auto;" />
                </div>
                <h2 style="color: #1e3a8a;">Subscription Renewal Alert</h2>
                <p>A subscription will be expiring soon and may need renewal.</p>
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f97316;">
                  <p><strong>Client:</strong> ${subscription.client_name}</p>
                  <p><strong>Subscription Type:</strong> ${subscription.subscription_type}</p>
                  <p><strong>Renewal Date:</strong> ${new Date(subscription.end_date).toLocaleDateString()}</p>
                  <p><strong>Days Until Renewal:</strong> ${days}</p>
                  ${subscription.price ? `<p><strong>Price:</strong> $${subscription.price}</p>` : ""}
                </div>
                <p>Please log in to your subscription dashboard to review or renew this subscription.</p>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #666; font-size: 12px;">
                  <p>Connecting You to the Digital World</p>
                </div>
              </div>
            `,
          })

          if (!emailResult.error) {
            // Create alert record
            await supabase.from("subscription_alerts").insert({
              subscription_id: subscription.id,
              alert_type: alertType,
            })

            results.sent++
            results.alerts.push({
              client: subscription.client_name,
              daysUntilRenewal: days,
              email: adminEmail,
            })
          } else {
            results.failed++
            console.error(`[CRON] Failed to send email for ${subscription.client_name}:`, emailResult.error)
          }
        } catch (error) {
          results.failed++
          console.error(`[CRON] Error processing subscription ${subscription.id}:`, error)
        }

        results.processed++
      }
    }

    return NextResponse.json({
      message: "Renewal alerts check completed",
      ...results,
    })
  } catch (error) {
    console.error("[CRON] Error in renewal alerts check:", error)
    return NextResponse.json({ error: "Failed to check renewal alerts" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Renewal alerts cron endpoint",
    usage: "POST with Authorization header: Bearer <CRON_SECRET_KEY>",
    thresholds: "60, 30, 14, 7 days before expiration",
  })
}
