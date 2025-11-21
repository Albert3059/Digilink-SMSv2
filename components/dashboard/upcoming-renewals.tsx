import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface Renewal {
  id: string;
  client_name: string;
  renewal_date: string;
  subscription_type: string;
}

export default function UpcomingRenewals({ renewals }: { renewals: Renewal[] }) {
  const isUrgent = (renewalDate: string) => {
    const renewal = new Date(renewalDate);
    const now = new Date();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    return renewal.getTime() - now.getTime() <= thirtyDays;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Renewals</CardTitle>
        <CardDescription>Subscriptions renewing in the next 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        {renewals.length === 0 ? (
          <p className="text-sm text-muted-foreground">No renewals scheduled in the next 30 days</p>
        ) : (
          <div className="space-y-4">
            {renewals.map((renewal) => {
              const urgent = isUrgent(renewal.renewal_date);
              
              return (
                <div
                  key={renewal.id}
                  className={`flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors ${
                    urgent ? "border-orange-500 bg-orange-50" : "border-border"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{renewal.client_name}</p>
                      {urgent && (
                        <Badge variant="destructive" className="text-xs">
                          Expiring Soon
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Renews on {new Date(renewal.renewal_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{renewal.subscription_type}</Badge>
                    <Link href={`/subscriptions/${renewal.id}`} className="text-xs text-primary hover:underline">
                      View
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
