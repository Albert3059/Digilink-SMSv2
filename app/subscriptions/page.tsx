"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import DashboardHeader from "@/components/dashboard/header"
import SubscriptionsTable from "@/components/subscriptions/subscriptions-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import ExportButton from "@/components/subscriptions/export-button"
import ReportButton from "@/components/subscriptions/report-button"

interface Subscription {
  id: string
  client_name: string
  client_email: string
  subscription_type: string
  status: "active" | "expired" | "cancelled"
  start_date: string
  end_date: string
  price?: number
  created_at: string
}

interface Admin {
  id: string
  email: string
  company_name: string
  report_email: string
}

export default function SubscriptionsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const filter = searchParams.get("filter")

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()

      // Get user
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (!currentUser) {
        router.push("/auth/login")
        return
      }

      setUser(currentUser)

      // Get admin profile
      const { data: adminData } = await supabase.from("admins").select("*").eq("id", currentUser.id).single()
      setAdmin(adminData)

      // Build query
      let query = supabase
        .from("subscriptions")
        .select("*")
        .eq("admin_id", currentUser.id)
        .order("end_date", { ascending: true })

      if (filter === "active") {
        query = query.eq("status", "active")
      } else if (filter === "expired") {
        query = query.eq("status", "expired")
      } else if (filter === "expiring") {
        // Filter for subscriptions expiring in next 30 days
        const now = new Date().toISOString()
        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

        query = query.eq("status", "active").gte("end_date", now).lte("end_date", thirtyDaysFromNow.toISOString())
      }

      const { data: subscriptionsData } = await query
      setSubscriptions(subscriptionsData || [])
      setLoading(false)
    }

    loadData()
  }, [filter, router])

  if (loading) {
    return (
      <div className="min-h-svh bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading subscriptions...</p>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-background">
      <DashboardHeader admin={admin} user={user} />

      <main className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Subscriptions</h1>
            <p className="text-muted-foreground mt-1">Manage all your client subscriptions</p>
          </div>
          <div className="flex gap-2">
            <ExportButton subscriptions={subscriptions} />
            <ReportButton
              subscriptions={subscriptions}
              adminEmail={admin?.report_email || user?.email || ""}
              companyName={admin?.company_name}
            />
            <Link href="/subscriptions/new">
              <Button>Add Subscription</Button>
            </Link>
          </div>
        </div>

        <SubscriptionsTable subscriptions={subscriptions} />
      </main>
    </div>
  )
}
