"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Mail } from "lucide-react"

interface ReportButtonProps {
  subscriptions?: any[]
  adminEmail?: string
  companyName?: string
}

export default function ReportButton({ subscriptions = [], adminEmail, companyName }: ReportButtonProps) {
  const [sending, setSending] = useState(false)

  const sendReport = async () => {
    try {
      setSending(true)
      console.log("[v0] Sending report with", subscriptions.length, "subscriptions")

      const response = await fetch("/api/reports/send-subscription-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptions: subscriptions || [],
          adminEmail: adminEmail || "admin@digilink.com",
          companyName: companyName || "Digilink IT Solutions",
        }),
      })

      const data = await response.json()
      console.log("[v0] Report response:", data)

      if (!response.ok) {
        throw new Error(data.error || "Failed to send report")
      }

      alert(data.message || "Report sent successfully!")
    } catch (error: any) {
      console.error("[v0] Error sending report:", error.message)
      alert(`Failed to send report: ${error.message || "Please try again."}`)
    } finally {
      setSending(false)
    }
  }

  return (
    <Button variant="outline" onClick={sendReport} disabled={sending || subscriptions.length === 0}>
      <Mail className="w-4 h-4 mr-2" />
      {sending ? "Sending..." : "Email Report"}
    </Button>
  )
}
