import { createClient } from "@/lib/supabase/server";
import { redirect } from 'next/navigation';
import DashboardHeader from "@/components/dashboard/header";
import SubscriptionDetail from "@/components/subscriptions/subscription-detail";

export default async function SubscriptionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch admin profile
  const { data: admin } = await supabase
    .from("admins")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("id", params.id)
    .eq("admin_id", user.id)
    .single();

  if (!subscription) {
    redirect("/subscriptions");
  }

  return (
    <div className="min-h-svh bg-background">
      <DashboardHeader admin={admin} user={user} />

      <main className="container py-8">
        <SubscriptionDetail subscription={subscription} />
      </main>
    </div>
  );
}
