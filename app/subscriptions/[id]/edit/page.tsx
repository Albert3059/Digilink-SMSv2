"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import SubscriptionEditForm from "@/components/subscriptions/subscription-edit-form"
import { createClient } from "@/lib/supabase/client"

export default function EditSubscriptionPage() {
  const router = useRouter()
  const params = useParams()
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const supabase = createClient()
        const { data, error: fetchError } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("id", params.id)
          .single()

        if (fetchError) throw fetchError
        if (!data) {
          router.push("/subscriptions")
          return
        }
        setSubscription(data)
      } catch (err) {
        console.log("[v0] Error fetching subscription:", err)
        setError("Failed to load subscription")
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [params.id, router])

  if (loading) {
    return (
      <div className="min-h-svh bg-background">
        <div className="container py-8">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !subscription) {
    return (
      <div className="min-h-svh bg-background">
        <div className="container py-8">
          <p className="text-red-500">{error || "Subscription not found"}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-background">
      <main className="container py-8">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold text-foreground mb-2">Edit Subscription</h1>
          <p className="text-muted-foreground mb-8">Update subscription details</p>
          <SubscriptionEditForm subscription={subscription} />
        </div>
      </main>
    </div>
  )
}
