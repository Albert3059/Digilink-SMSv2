import { createClient } from "@/lib/supabase/server";
import { redirect } from 'next/navigation';
import DashboardHeader from "@/components/dashboard/header";
import SubscriptionForm from "@/components/subscriptions/subscription-form";

export default async function NewSubscriptionPage() {
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

  return (
    <div className="min-h-svh bg-background">
      <DashboardHeader admin={admin} user={user} />

      <main className="container py-8">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold text-foreground mb-2">Add New Subscription</h1>
          <p className="text-muted-foreground mb-8">Create a new client subscription to track</p>
          <SubscriptionForm />
        </div>
      </main>
    </div>
  );
}
