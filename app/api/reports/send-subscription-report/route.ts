import { NextResponse } from "next/server"
import { getResend } from '../../../../lib/resend'

export async function POST(request: Request) {
  try {
    console.log("[v0] Report API called")

    if (!process.env.RESEND_API_KEY) {
      console.error("[v0] RESEND_API_KEY is not configured")
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 })
    }

    const { subscriptions, adminEmail, companyName } = await request.json()

    if (!subscriptions || !Array.isArray(subscriptions)) {
      console.error("[v0] Invalid subscriptions data")
      return NextResponse.json({ error: "Invalid subscriptions data" }, { status: 400 })
    }

    if (!adminEmail) {
      console.error("[v0] No admin email provided")
      return NextResponse.json({ error: "Admin email is required" }, { status: 400 })
    }

    const resend = getResend()
    if (!resend) {
      console.error("[v0] RESEND_API_KEY is not configured (getResend returned null)")
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 })
    }

    // Log presence (but never log the full secret). This helps verify the function
    // environment at runtime without exposing the key in plaintext.
    try {
      const present = !!process.env.RESEND_API_KEY
      const len = process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.length : 0
      console.log(`[v0] RESEND_API_KEY present: ${present} (length=${len})`)
    } catch (e) {
      console.log('[v0] Unable to read RESEND_API_KEY at runtime')
    }

    console.log("[v0] Preparing report for:", adminEmail)

    // Calculate statistics
    const totalSubscriptions = subscriptions.length
    const activeSubscriptions = subscriptions.filter((s) => s.status === "active").length
    const expiredSubscriptions = subscriptions.filter((s) => s.status === "expired").length
    const totalRevenue = subscriptions.reduce((sum, s) => sum + (Number.parseFloat(s.price) || 0), 0)

    // Get subscriptions expiring in next 30 days
    const today = new Date()
    const thirtyDaysFromNow = new Date(today)
    thirtyDaysFromNow.setDate(today.getDate() + 30)

    const upcomingRenewals = subscriptions.filter((sub) => {
      if (!sub.renewal_date) return false
      const renewalDate = new Date(sub.renewal_date)
      return renewalDate >= today && renewalDate <= thirtyDaysFromNow
    })

    // Generate HTML report
    const reportHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .logo { text-align: center; margin-bottom: 30px; }
          .logo img { max-width: 300px; height: auto; }
          .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 30px; border-radius: 8px; margin-bottom: 30px; }
          .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
          .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #1e3a8a; }
          .stat-label { font-size: 14px; color: #666; margin-bottom: 5px; }
          .stat-value { font-size: 32px; font-weight: bold; color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #f8f9fa; font-weight: 600; }
          .status { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
          .status.active { background: #d1fae5; color: #065f46; }
          .status.expired { background: #fee2e2; color: #991b1b; }
          .status.pending { background: #fef3c7; color: #92400e; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <img src="/images/fulllogo.png" alt="Digilink IT Solutions" />
          </div>
          
          <div class="header">
            <h1>Subscription Report</h1>
            <p>${companyName || "Digilink IT Solutions"}</p>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>

          <div class="stats">
            <div class="stat-card">
              <div class="stat-label">Total Subscriptions</div>
              <div class="stat-value">${totalSubscriptions}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Active Subscriptions</div>
              <div class="stat-value">${activeSubscriptions}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Expired Subscriptions</div>
              <div class="stat-value">${expiredSubscriptions}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Total Revenue</div>
              <div class="stat-value">$${totalRevenue.toFixed(2)}</div>
            </div>
          </div>

          <h2>Upcoming Renewals (Next 30 Days)</h2>
          ${
            upcomingRenewals.length > 0
              ? `
            <table>
              <thead>
                <tr>
                  <th>Client Name</th>
                  <th>Type</th>
                  <th>Renewal Date</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                ${upcomingRenewals
                  .map(
                    (sub) => `
                  <tr>
                    <td>${sub.client_name}</td>
                    <td>${sub.subscription_type}</td>
                    <td>${new Date(sub.renewal_date).toLocaleDateString()}</td>
                    <td>$${Number.parseFloat(sub.price).toFixed(2)}</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          `
              : `<p>No upcoming renewals in the next 30 days.</p>`
          }

          <h2>All Subscriptions</h2>
          <table>
            <thead>
              <tr>
                <th>Client Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>End Date</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              ${subscriptions
                .map(
                  (sub) => `
                <tr>
                  <td>${sub.client_name}</td>
                  <td>${sub.subscription_type}</td>
                  <td><span class="status ${sub.status}">${sub.status}</span></td>
                  <td>${new Date(sub.end_date).toLocaleDateString()}</td>
                  <td>$${Number.parseFloat(sub.price).toFixed(2)}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>

          <div class="footer">
            <p>This is an automated report from Digilink IT Solutions Subscription Management System</p>
            <p style="font-size: 12px; margin-top: 10px;">Connecting You to the Digital World</p>
          </div>
        </div>
      </body>
      </html>
    `

    console.log("[v0] Sending email to:", adminEmail)

    try {
      const result = await resend.emails.send({
        from: "Digilink IT Solutions <info@digilinkict.co.za>",
        to: adminEmail,
        subject: `Subscription Report - ${new Date().toLocaleDateString()}`,
        html: reportHtml,
      })

      console.log("[v0] Email sent successfully:", (result as any)?.id)

      return NextResponse.json({
        message: "Report sent successfully",
        emailId: (result as any)?.id,
      })
    } catch (emailError: any) {
      console.error("[v0] Exception sending email:", emailError)
      return NextResponse.json(
        { error: `Email service error: ${emailError?.message || "Unknown error"}` },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("[v0] Unexpected error generating report:", error)
    return NextResponse.json(
      { error: `Failed to generate report: ${error.message || "Unknown error"}` },
      { status: 500 },
    )
  }
}
