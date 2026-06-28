-- Supabase Schema for Eventzone CRM

-- 1. Users (Team Members)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  avatar TEXT,
  target NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  total_points_balance NUMERIC DEFAULT 0,
  last_reset_date TIMESTAMPTZ,
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  is_currently_checked_in BOOLEAN DEFAULT FALSE
);

-- 2. Clients
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  sector TEXT,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  wilaya TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  converted_from_lead_id UUID,
  revenue NUMERIC DEFAULT 0,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  additional_emails TEXT[] DEFAULT '{}',
  rc TEXT,
  nif TEXT,
  nis TEXT,
  art TEXT,
  rib TEXT,
  bank_name TEXT,
  address TEXT
);

-- 3. Leads
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  event_date TIMESTAMPTZ,
  estimated_value NUMERIC DEFAULT 0,
  service_type TEXT,
  stage TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  converted_to_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  notes TEXT,
  score NUMERIC DEFAULT 0,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  source TEXT,
  points_awarded_for_qualification BOOLEAN DEFAULT FALSE,
  points_awarded_for_offer_stage BOOLEAN DEFAULT FALSE,
  website TEXT,
  event_name TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  additional_emails TEXT[] DEFAULT '{}',
  rc TEXT,
  nif TEXT,
  nis TEXT,
  art TEXT,
  rib TEXT,
  bank_name TEXT
);

-- 4. Offers (Financial Documents)
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  related_to_id UUID NOT NULL,
  related_to_type TEXT NOT NULL, -- 'Client' or 'Lead'
  document_type TEXT DEFAULT 'Devis', -- 'Devis', 'Facture', 'Facture Proforma'
  event_name TEXT NOT NULL,
  event_date TIMESTAMPTZ,
  attendees NUMERIC DEFAULT 0,
  services_included TEXT[] DEFAULT '{}',
  custom_services JSONB DEFAULT '[]',
  price NUMERIC DEFAULT 0,
  status TEXT NOT NULL,
  follow_up_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  attachment_name TEXT,
  attachment_url TEXT
);

-- 5. Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  related_to_id UUID,
  related_to_type TEXT, -- 'Lead', 'Client', 'Plateforme'
  due_date TIMESTAMPTZ,
  priority TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  "order" NUMERIC DEFAULT 0
);

-- 6. Events (Log)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  wilaya TEXT,
  attendees NUMERIC DEFAULT 0,
  badges_printed NUMERIC DEFAULT 0,
  services_delivered TEXT[] DEFAULT '{}',
  satisfaction_rating NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Expected Revenues
CREATE TABLE IF NOT EXISTS expected_revenues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  amount NUMERIC DEFAULT 0
);

-- 8. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'info', 'success', 'warning', 'error'
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  source_id UUID,
  source_type TEXT,
  action_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- 9. Documents
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL,
  size NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE
);

-- 10. Interactions
CREATE TABLE IF NOT EXISTS interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  outcome TEXT,
  notes TEXT,
  action_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Sourcing Websites
CREATE TABLE IF NOT EXISTS sourcing_websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Social Posts
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  caption TEXT,
  attachment_url TEXT,
  scheduled_date TIMESTAMPTZ,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- 13. Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  status TEXT NOT NULL,
  content_type TEXT,
  budget_dzd NUMERIC DEFAULT 0,
  paid_ads_cost NUMERIC DEFAULT 0,
  content_creation_cost NUMERIC DEFAULT 0,
  other_costs NUMERIC DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  target_leads INTEGER DEFAULT 0,
  target_clicks INTEGER DEFAULT 0,
  actual_clicks INTEGER DEFAULT 0,
  leads_generated INTEGER DEFAULT 0,
  notes TEXT,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- 14. Content Ideas
CREATE TABLE IF NOT EXISTS content_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  platform TEXT NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- 15. Attendance
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  check_in TIMESTAMPTZ NOT NULL,
  check_out TIMESTAMPTZ,
  date DATE NOT NULL,
  points_earned NUMERIC DEFAULT 0
);

-- 16. Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  category TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  wilaya TEXT,
  website TEXT,
  description TEXT,
  services_provided TEXT[] DEFAULT '{}',
  contract_status TEXT DEFAULT 'Aucun',
  contract_start_date TIMESTAMPTZ,
  contract_end_date TIMESTAMPTZ,
  contract_url TEXT,
  payment_terms TEXT,
  price_list JSONB DEFAULT '[]',
  rating NUMERIC DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  is_preferred BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17.5. Base Prices
CREATE TABLE IF NOT EXISTS base_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC DEFAULT 0,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Supplier Orders
CREATE TABLE IF NOT EXISTS supplier_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  order_date TIMESTAMPTZ DEFAULT NOW(),
  delivery_date TIMESTAMPTZ,
  items JSONB DEFAULT '[]',
  total_amount NUMERIC DEFAULT 0,
  status TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  invoice_url TEXT,
  contract_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Staff
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  gender TEXT,
  staff_type TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  date_of_birth DATE,
  wilaya TEXT,
  address TEXT,
  profile_photo_url TEXT,
  id_card_number TEXT,
  languages TEXT[] DEFAULT '{}',
  clothing_size TEXT,
  shoe_size TEXT,
  experience_years NUMERIC DEFAULT 0,
  specializations TEXT[] DEFAULT '{}',
  availability TEXT,
  daily_rate_dzd NUMERIC DEFAULT 0,
  half_day_rate_dzd NUMERIC DEFAULT 0,
  rating NUMERIC DEFAULT 0,
  total_events INTEGER DEFAULT 0,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. Staff Assignments
CREATE TABLE IF NOT EXISTS staff_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  event_location TEXT,
  role_at_event TEXT,
  performance_rating NUMERIC DEFAULT 0,
  manager_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. Company Settings
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000000',
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  rc TEXT,
  nif TEXT,
  nis TEXT,
  art TEXT,
  rib TEXT,
  bank_name TEXT,
  logo_url TEXT
);

-- Insert default admin if not exists
INSERT INTO users (id, name, role, email, password, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'Mohamed Hachemi', 'Manager', 'contact@eventzone.pro', 'Ben10?40', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Insert default company settings if not exists
INSERT INTO company_settings (id, name, address, phone, email)
VALUES ('00000000-0000-0000-0000-000000000000', 'Eventzone', 'Alger, Algérie', '0550000000', 'contact@eventzone.pro')
ON CONFLICT (id) DO NOTHING;
