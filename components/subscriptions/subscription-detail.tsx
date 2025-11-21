"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface SubscriptionDetailProps {
  subscription: any;
}

export default function SubscriptionDetail({ subscription }: SubscriptionDetailProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this subscription?")) return;

    const supabase = createClient();
    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("subscriptions")
        .delete()
        .eq("id", subscription.id);

      if (error) throw error;
      router.push("/subscriptions");
    } catch (error) {
      alert("Error deleting subscription");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "expired":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const daysUntilExpiry = Math.ceil(
    (new Date(subscription.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{subscription.client_name}</h1>
          <p className="text-muted-foreground mt-1">{subscription.client_email}</p>
        </div>
        <Badge className={getStatusColor(subscription.status)}>
          {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
        </Badge>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Subscription Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium">{subscription.subscription_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="font-medium">{subscription.price ? `$${subscription.price.toFixed(2)}` : "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-medium">{formatDate(subscription.start_date)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">End Date</p>
                <p className="font-medium">{formatDate(subscription.end_date)}</p>
              </div>
            </div>
            {subscription.renewal_date && (
              <div>
                <p className="text-sm text-muted-foreground">Renewal Date</p>
                <p className="font-medium">{formatDate(subscription.renewal_date)}</p>
              </div>
            )}
            {daysUntilExpiry > 0 && (
              <div className="p-3 bg-orange-100 text-orange-800 rounded-lg text-sm">
                Expires in {daysUntilExpiry} days
              </div>
            )}
            {subscription.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="font-medium">{subscription.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Link href={`/subscriptions/${subscription.id}/edit`}>
            <Button>Edit</Button>
          </Link>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
          <Link href="/subscriptions">
            <Button variant="outline">Back</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
