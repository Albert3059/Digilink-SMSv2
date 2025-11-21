"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

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

interface TableProps {
  subscriptions: Subscription[]
}

const colorOptions = [
  "bg-blue-50",
  "bg-green-50",
  "bg-purple-50",
  "bg-yellow-50",
  "bg-pink-50",
  "bg-indigo-50",
  "bg-teal-50",
  "bg-orange-50",
]

export default function SubscriptionsTable({ subscriptions }: TableProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "expired":
        return "bg-red-100 text-red-800"
      case "cancelled":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRowColor = (index: number) => {
    return colorOptions[index % colorOptions.length]
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString()
  }

  const isExpiringSoon = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    const daysUntilExpiry = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subscription?")) return

    setDeletingId(id)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("subscriptions").delete().eq("id", id)

      if (error) throw error
      router.refresh()
    } catch (err) {
      alert("Failed to delete subscription")
      setDeletingId(null)
    }
  }

  if (subscriptions.length === 0) {
    return (
      <div className="text-center py-12 border border-border rounded-lg bg-accent/50">
        <p className="text-muted-foreground mb-4">No subscriptions found</p>
        <Link href="/subscriptions/new">
          <Button>Create your first subscription</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted">
            <TableHead>Client</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Price</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscriptions.map((subscription, index) => (
            <TableRow key={subscription.id} className={`${getRowColor(index)} hover:opacity-75 transition-opacity`}>
              <TableCell>
                <div>
                  <p className="font-medium">{subscription.client_name}</p>
                  <p className="text-xs text-muted-foreground">{subscription.client_email}</p>
                </div>
              </TableCell>
              <TableCell className="text-sm">{subscription.subscription_type}</TableCell>
              <TableCell className="text-sm">{formatDate(subscription.start_date)}</TableCell>
              <TableCell className="text-sm">
                {formatDate(subscription.end_date)}
                {isExpiringSoon(subscription.end_date) && <p className="text-xs text-orange-600 mt-1">Expiring soon</p>}
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(subscription.status)}>
                  {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">
                {subscription.price ? `$${subscription.price.toFixed(2)}` : "-"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  <Link href={`/subscriptions/${subscription.id}/edit`}>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(subscription.id)}
                    disabled={deletingId === subscription.id}
                  >
                    {deletingId === subscription.id ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
