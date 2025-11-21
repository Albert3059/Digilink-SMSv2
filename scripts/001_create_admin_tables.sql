-- Create admins table for storing admin user profiles
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  company_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on admins table
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Admins can view their own profile
CREATE POLICY "admins_select_own" ON public.admins
  FOR SELECT USING (auth.uid() = id);

-- Admins can update their own profile
CREATE POLICY "admins_update_own" ON public.admins
  FOR UPDATE USING (auth.uid() = id);

-- Admins can insert their own profile
CREATE POLICY "admins_insert_own" ON public.admins
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins can delete their own profile
CREATE POLICY "admins_delete_own" ON public.admins
  FOR DELETE USING (auth.uid() = id);

-- Create subscriptions table for managing client subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  subscription_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  renewal_date DATE,
  price DECIMAL(10, 2),
  notes TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on subscriptions table
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Each admin can view only their own subscriptions
CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT USING (auth.uid() = admin_id);

-- Each admin can insert only their own subscriptions
CREATE POLICY "subscriptions_insert_own" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = admin_id);

-- Each admin can update only their own subscriptions
CREATE POLICY "subscriptions_update_own" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = admin_id);

-- Each admin can delete only their own subscriptions
CREATE POLICY "subscriptions_delete_own" ON public.subscriptions
  FOR DELETE USING (auth.uid() = admin_id);

-- Create subscription_alerts table for tracking sent notifications
CREATE TABLE IF NOT EXISTS public.subscription_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('expiry_warning', 'expired', 'renewal_reminder')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on subscription_alerts table
ALTER TABLE public.subscription_alerts ENABLE ROW LEVEL SECURITY;

-- Admins can view alerts for their subscriptions
CREATE POLICY "alerts_select_own" ON public.subscription_alerts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.subscriptions 
      WHERE subscriptions.id = subscription_alerts.subscription_id 
      AND subscriptions.admin_id = auth.uid()
    )
  );
