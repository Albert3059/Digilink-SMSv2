import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DashboardHeader from "@/components/dashboard/header"
import DashboardStats from "@/components/dashboard/stats"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: admin } = await supabase.from("admins").select("*").eq("id", user.id).single()

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("admin_id", user.id)
    .order("end_date", { ascending: true })

  const activeCount = subscriptions?.filter((s) => s.status === "active").length || 0
  const expiredCount = subscriptions?.filter((s) => s.status === "expired").length || 0
  const totalCount = subscriptions?.length || 0

  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  const now = new Date()

  const expiringSoonCount =
    subscriptions?.filter((s) => {
      if (!s.end_date || s.status !== "active") return false
      const endDate = new Date(s.end_date)
      return endDate > now && endDate <= thirtyDaysFromNow
    }).length || 0

  return (
    <div className="min-h-svh bg-background">
      <DashboardHeader admin={admin} user={user} />

      <main className="container py-8">
        <div className="flex flex-col items-center text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage and track all your client subscriptions</p>
          <Link href="/subscriptions/new">
            <Button className="mt-4">Add Subscription</Button>
          </Link>
        </div>

        <DashboardStats
          active={activeCount}
          expired={expiredCount}
          total={totalCount}
          expiringSoon={expiringSoonCount}
        />
      </main>
    </div>
  )
}
