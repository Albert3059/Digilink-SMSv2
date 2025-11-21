import { createClient } from "@/lib/supabase/server";
import { redirect } from 'next/navigation';
import DashboardHeader from "@/components/dashboard/header";
import AdminProfileForm from "@/components/settings/admin-profile-form";
import LogoUpload from "@/components/settings/logo-upload";

export default async function SettingsPage() {
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground mb-8">Manage your account and profile</p>

          <div className="space-y-8">
            <LogoUpload admin={admin} />
            <AdminProfileForm admin={admin} user={user} />
            <AccountSecuritySection user={user} />
          </div>
        </div>
      </main>
    </div>
  );
}

function AccountSecuritySection({ user }: { user: any }) {
  return (
    <div className="border border-border rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Account Security</h2>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Email Address</p>
          <p className="font-medium">{user?.email}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-3">Password</p>
          <button className="text-sm text-primary hover:underline">
            Change password
          </button>
        </div>
      </div>
    </div>
  );
}
