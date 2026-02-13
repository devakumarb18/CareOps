
-- =============================================
-- CareOps Database Schema - Phase 1
-- =============================================

-- Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'staff');

-- Workspace status enum
CREATE TYPE public.workspace_status AS ENUM ('onboarding', 'active', 'inactive');

-- Booking status enum
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'completed', 'no_show', 'cancelled');

-- Conversation status enum
CREATE TYPE public.conversation_status AS ENUM ('open', 'waiting', 'closed');

-- Message type enum
CREATE TYPE public.message_type AS ENUM ('auto', 'manual', 'system');

-- Form status enum
CREATE TYPE public.form_status AS ENUM ('pending', 'completed', 'overdue');

-- Alert type enum
CREATE TYPE public.alert_type AS ENUM ('unconfirmed_booking', 'overdue_form', 'low_stock', 'missed_message');

-- =============================================
-- WORKSPACES
-- =============================================
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  contact_email TEXT,
  status public.workspace_status NOT NULL DEFAULT 'onboarding',
  onboarding_step INTEGER NOT NULL DEFAULT 1,
  slug TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PROFILES
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- USER ROLES
-- =============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SECURITY DEFINER: has_role
-- =============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- =============================================
-- SERVICES
-- =============================================
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL DEFAULT 60,
  price NUMERIC(10,2),
  location TEXT,
  slug TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- =============================================
-- AVAILABILITY
-- =============================================
CREATE TABLE public.availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL
);
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;

-- =============================================
-- CONTACTS
-- =============================================
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- =============================================
-- CONVERSATIONS
-- =============================================
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL UNIQUE,
  status public.conversation_status NOT NULL DEFAULT 'open',
  automation_paused BOOLEAN NOT NULL DEFAULT false,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- =============================================
-- MESSAGES
-- =============================================
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type public.message_type NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- =============================================
-- BOOKINGS
-- =============================================
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  status public.booking_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- FORMS
-- =============================================
CREATE TABLE public.forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  fields JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;

-- =============================================
-- FORM RESPONSES
-- =============================================
CREATE TABLE public.form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES public.forms(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  status public.form_status NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;

-- =============================================
-- INVENTORY
-- =============================================
CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  unit TEXT DEFAULT 'units',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- =============================================
-- INVENTORY USAGE (per service)
-- =============================================
CREATE TABLE public.inventory_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
  inventory_id UUID REFERENCES public.inventory(id) ON DELETE CASCADE NOT NULL,
  quantity_per_booking INTEGER NOT NULL DEFAULT 1
);
ALTER TABLE public.inventory_usage ENABLE ROW LEVEL SECURITY;

-- =============================================
-- AUTOMATION RULES
-- =============================================
CREATE TABLE public.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  event TEXT NOT NULL,
  action TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

-- =============================================
-- AUTOMATION LOGS
-- =============================================
CREATE TABLE public.automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  rule_id UUID REFERENCES public.automation_rules(id) ON DELETE SET NULL,
  event TEXT NOT NULL,
  action TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'success',
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- ALERTS
-- =============================================
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  type public.alert_type NOT NULL,
  entity_id UUID,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- =============================================
-- INTEGRATIONS
-- =============================================
CREATE TABLE public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- =============================================
-- HELPER: get workspace_id for current user
-- =============================================
CREATE OR REPLACE FUNCTION public.get_user_workspace_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT workspace_id FROM public.profiles WHERE user_id = auth.uid()
$$;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Workspaces: members can view their workspace
CREATE POLICY "Members can view workspace" ON public.workspaces FOR SELECT USING (id = public.get_user_workspace_id());
CREATE POLICY "Admins can update workspace" ON public.workspaces FOR UPDATE USING (id = public.get_user_workspace_id() AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert workspace" ON public.workspaces FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- For all workspace-scoped tables, members of the workspace can read, admins can write
-- Services
CREATE POLICY "Members can view services" ON public.services FOR SELECT USING (workspace_id = public.get_user_workspace_id());
CREATE POLICY "Admins can manage services" ON public.services FOR ALL USING (workspace_id = public.get_user_workspace_id() AND public.has_role(auth.uid(), 'admin'));

-- Availability
CREATE POLICY "Members can view availability" ON public.availability FOR SELECT USING (
  service_id IN (SELECT id FROM public.services WHERE workspace_id = public.get_user_workspace_id())
);
CREATE POLICY "Admins can manage availability" ON public.availability FOR ALL USING (
  service_id IN (SELECT id FROM public.services WHERE workspace_id = public.get_user_workspace_id()) AND public.has_role(auth.uid(), 'admin')
);

-- Contacts
CREATE POLICY "Members can view contacts" ON public.contacts FOR SELECT USING (workspace_id = public.get_user_workspace_id());
CREATE POLICY "Members can manage contacts" ON public.contacts FOR ALL USING (workspace_id = public.get_user_workspace_id());

-- Conversations
CREATE POLICY "Members can view conversations" ON public.conversations FOR SELECT USING (workspace_id = public.get_user_workspace_id());
CREATE POLICY "Members can manage conversations" ON public.conversations FOR ALL USING (workspace_id = public.get_user_workspace_id());

-- Messages
CREATE POLICY "Members can view messages" ON public.messages FOR SELECT USING (
  conversation_id IN (SELECT id FROM public.conversations WHERE workspace_id = public.get_user_workspace_id())
);
CREATE POLICY "Members can insert messages" ON public.messages FOR INSERT WITH CHECK (
  conversation_id IN (SELECT id FROM public.conversations WHERE workspace_id = public.get_user_workspace_id())
);

-- Bookings
CREATE POLICY "Members can view bookings" ON public.bookings FOR SELECT USING (workspace_id = public.get_user_workspace_id());
CREATE POLICY "Members can manage bookings" ON public.bookings FOR ALL USING (workspace_id = public.get_user_workspace_id());

-- Forms
CREATE POLICY "Members can view forms" ON public.forms FOR SELECT USING (workspace_id = public.get_user_workspace_id());
CREATE POLICY "Admins can manage forms" ON public.forms FOR ALL USING (workspace_id = public.get_user_workspace_id() AND public.has_role(auth.uid(), 'admin'));

-- Form Responses
CREATE POLICY "Members can view form responses" ON public.form_responses FOR SELECT USING (
  form_id IN (SELECT id FROM public.forms WHERE workspace_id = public.get_user_workspace_id())
);
CREATE POLICY "Members can manage form responses" ON public.form_responses FOR ALL USING (
  form_id IN (SELECT id FROM public.forms WHERE workspace_id = public.get_user_workspace_id())
);

-- Inventory
CREATE POLICY "Members can view inventory" ON public.inventory FOR SELECT USING (workspace_id = public.get_user_workspace_id());
CREATE POLICY "Admins can manage inventory" ON public.inventory FOR ALL USING (workspace_id = public.get_user_workspace_id() AND public.has_role(auth.uid(), 'admin'));

-- Inventory Usage
CREATE POLICY "Members can view inventory usage" ON public.inventory_usage FOR SELECT USING (
  service_id IN (SELECT id FROM public.services WHERE workspace_id = public.get_user_workspace_id())
);
CREATE POLICY "Admins can manage inventory usage" ON public.inventory_usage FOR ALL USING (
  service_id IN (SELECT id FROM public.services WHERE workspace_id = public.get_user_workspace_id()) AND public.has_role(auth.uid(), 'admin')
);

-- Automation Rules
CREATE POLICY "Admins can view automation rules" ON public.automation_rules FOR SELECT USING (workspace_id = public.get_user_workspace_id() AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage automation rules" ON public.automation_rules FOR ALL USING (workspace_id = public.get_user_workspace_id() AND public.has_role(auth.uid(), 'admin'));

-- Automation Logs
CREATE POLICY "Admins can view automation logs" ON public.automation_logs FOR SELECT USING (workspace_id = public.get_user_workspace_id());

-- Alerts
CREATE POLICY "Members can view alerts" ON public.alerts FOR SELECT USING (workspace_id = public.get_user_workspace_id());
CREATE POLICY "Members can manage alerts" ON public.alerts FOR ALL USING (workspace_id = public.get_user_workspace_id());

-- Integrations
CREATE POLICY "Admins can view integrations" ON public.integrations FOR SELECT USING (workspace_id = public.get_user_workspace_id() AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage integrations" ON public.integrations FOR ALL USING (workspace_id = public.get_user_workspace_id() AND public.has_role(auth.uid(), 'admin'));

-- =============================================
-- TRIGGER: auto-create profile on signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_workspace_id UUID;
BEGIN
  -- Create a workspace for the new user
  INSERT INTO public.workspaces (name, contact_email)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Business'), NEW.email)
  RETURNING id INTO new_workspace_id;

  -- Create profile
  INSERT INTO public.profiles (user_id, workspace_id, display_name)
  VALUES (NEW.id, new_workspace_id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));

  -- Assign admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin');

  -- Create default automation rules
  INSERT INTO public.automation_rules (workspace_id, event, action) VALUES
    (new_workspace_id, 'new_contact', 'send_welcome_email'),
    (new_workspace_id, 'booking_created', 'send_confirmation_email'),
    (new_workspace_id, 'booking_reminder', 'send_reminder_email'),
    (new_workspace_id, 'form_overdue', 'send_form_reminder'),
    (new_workspace_id, 'staff_reply', 'pause_automation'),
    (new_workspace_id, 'low_stock', 'send_stock_alert');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- TRIGGER: updated_at
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON public.workspaces FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
