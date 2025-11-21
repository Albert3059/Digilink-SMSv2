"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SubscriptionEditFormProps {
  subscription: any
}

export default function SubscriptionEditForm({ subscription }: SubscriptionEditFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    client_name: subscription.client_name,
    client_email: subscription.client_email,
    subscription_type: subscription.subscription_type,
    start_date: subscription.start_date,
    end_date: subscription.end_date,
    renewal_date: subscription.renewal_date || "",
    price: subscription.price || "",
    notes: subscription.notes || "",
    status: subscription.status,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field?: string) => {
    const target = e.target
    const name = field || (target as HTMLInputElement | HTMLTextAreaElement).name
    const value = (target as HTMLInputElement | HTMLTextAreaElement).value
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (value: string, field: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          client_name: formData.client_name,
          client_email: formData.client_email,
          subscription_type: formData.subscription_type,
          start_date: formData.start_date,
          end_date: formData.end_date,
          renewal_date: formData.renewal_date || null,
          price: formData.price ? Number.parseFloat(formData.price) : null,
          notes: formData.notes || null,
          status: formData.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscription.id)

      if (updateError) throw updateError
      router.push("/subscriptions")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Subscription</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="client_name">Client Name *</Label>
              <Input
                id="client_name"
                name="client_name"
                required
                value={formData.client_name}
                onChange={handleChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="client_email">Client Email *</Label>
              <Input
                id="client_email"
                name="client_email"
                type="email"
                required
                value={formData.client_email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="subscription_type">Subscription Type *</Label>
              <Input
                id="subscription_type"
                name="subscription_type"
                required
                value={formData.subscription_type}
                onChange={handleChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => handleSelectChange(value, "status")}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                required
                value={formData.start_date}
                onChange={handleChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end_date">End Date *</Label>
              <Input
                id="end_date"
                name="end_date"
                type="date"
                required
                value={formData.end_date}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="renewal_date">Renewal Date (Optional)</Label>
              <Input
                id="renewal_date"
                name="renewal_date"
                type="date"
                value={formData.renewal_date}
                onChange={handleChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Price (Optional)</Label>
              <Input id="price" name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
