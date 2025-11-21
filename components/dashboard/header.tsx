"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useState } from "react";
import Image from "next/image";

interface HeaderProps {
  admin: any;
  user: any;
}

export default function DashboardHeader({ admin, user }: HeaderProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <header className="border-b border-border bg-background">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image 
            src="/digilink-logo.png" 
            alt="Digilink IT Solutions" 
            width={180}
            height={40}
            className="h-10 w-auto"
          />
        </Link>

        <nav className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm hover:text-primary transition-colors">
            Dashboard
          </Link>
          <Link href="/subscriptions" className="text-sm hover:text-primary transition-colors">
            Subscriptions
          </Link>
          <Link href="/settings" className="text-sm hover:text-primary transition-colors">
            Settings
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{admin?.company_name || user?.email}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={isLoading}
            >
              {isLoading ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
