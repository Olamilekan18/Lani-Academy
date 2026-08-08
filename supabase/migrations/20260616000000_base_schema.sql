-- ============================================================
-- Base schema — core tables, RLS and the new-user trigger.
-- Must run before all later migrations (they reference these tables).
-- Idempotent: safe to re-run.
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE / DROP ... IF EXISTS.
-- Requires the pgcrypto extension for gen_random_bytes().
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Enable UUID Extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Profiles Table (Linked to Auth.Users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    organisation TEXT,
    job_title TEXT,
    role TEXT CHECK (role IN ('learner', 'facilitator', 'admin', 'super_admin', 'organization')) DEFAULT 'learner',
    avatar_url TEXT,
    bio TEXT,
    qualifications TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);


-- 3. Create Courses Table
CREATE TABLE IF NOT EXISTS public.courses (
    id TEXT PRIMARY KEY, -- human readable string identifier e.g., 'digital-transformation-officer'
    title TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    category TEXT,
    thematic_area TEXT,
    type TEXT CHECK (type IN ('Open Programme', 'Certification Prep', 'Bootcamp', 'Corporate', 'Sponsored')),
    level TEXT CHECK (level IN ('Foundation', 'Intermediate', 'Advanced', 'Executive')),
    delivery_modes TEXT[] DEFAULT '{}',
    duration TEXT,
    price NUMERIC DEFAULT 0,
    certification TEXT,
    status TEXT DEFAULT 'Open',
    start_date DATE,
    end_date DATE,
    image TEXT,
    short_description TEXT,
    full_description TEXT,
    outcomes TEXT[] DEFAULT '{}',
    audience TEXT[] DEFAULT '{}',
    modules JSONB DEFAULT '[]', -- array of modules: [{title: "...", lessons: ["..."]}]
    facilitator TEXT,
    materials TEXT[] DEFAULT '{}',
    assessment TEXT,
    seats INTEGER DEFAULT 50,
    enrolled INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for Courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Courses Policies
DROP POLICY IF EXISTS "Courses are viewable by everyone" ON public.courses;
CREATE POLICY "Courses are viewable by everyone" ON public.courses
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can modify courses" ON public.courses;
CREATE POLICY "Admins can modify courses" ON public.courses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid() AND (public.profiles.role = 'admin' OR public.profiles.role = 'super_admin')
        )
    );

-- Assigned facilitators may update their own courses (e.g. manage curriculum)
DROP POLICY IF EXISTS "Facilitators update assigned courses" ON public.courses;
CREATE POLICY "Facilitators update assigned courses" ON public.courses
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.facilitator_assignments fa
            WHERE fa.course_id = public.courses.id AND fa.facilitator_email = auth.email()
        )
    );


-- 4. Create Enrollments Table
CREATE TABLE IF NOT EXISTS public.enrollments (
    id TEXT PRIMARY KEY DEFAULT 'enr-' || encode(gen_random_bytes(6), 'hex'),
    course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
    learner_name TEXT NOT NULL,
    learner_email TEXT NOT NULL,
    progress INTEGER DEFAULT 0,
    completed_lessons TEXT[] DEFAULT '{}',
    payment_status TEXT CHECK (payment_status IN ('Successful', 'Pending', 'Manual Review')) DEFAULT 'Pending',
    enrolled_at DATE DEFAULT CURRENT_DATE,
    sponsor_organisation TEXT
);

-- Enable RLS for Enrollments
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Enrollments Policies
DROP POLICY IF EXISTS "Learners can view their own enrollments" ON public.enrollments;
CREATE POLICY "Learners can view their own enrollments" ON public.enrollments
    FOR SELECT USING (auth.email() = learner_email);

DROP POLICY IF EXISTS "Learners can insert their own enrollments" ON public.enrollments;
CREATE POLICY "Learners can insert their own enrollments" ON public.enrollments
    FOR INSERT WITH CHECK (auth.email() = learner_email OR auth.uid() IS NULL); -- Allow guest registration, will associate with email

DROP POLICY IF EXISTS "Learners can update progress" ON public.enrollments;
CREATE POLICY "Learners can update progress" ON public.enrollments
    FOR UPDATE USING (auth.email() = learner_email OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE public.profiles.id = auth.uid() AND (public.profiles.role = 'admin' OR public.profiles.role = 'super_admin')
    ));

DROP POLICY IF EXISTS "Admins can view and edit all enrollments" ON public.enrollments;
CREATE POLICY "Admins can view and edit all enrollments" ON public.enrollments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid() AND (public.profiles.role = 'admin' OR public.profiles.role = 'super_admin')
        )
    );


-- 5. Create Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY DEFAULT 'txn-' || encode(gen_random_bytes(6), 'hex'),
    course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
    learner_email TEXT NOT NULL,
    amount NUMERIC DEFAULT 0,
    gateway TEXT CHECK (gateway IN ('Paystack', 'Flutterwave', 'Bank Transfer')) DEFAULT 'Paystack',
    status TEXT CHECK (status IN ('Pending', 'Successful', 'Failed', 'Refunded', 'Manually Confirmed')) DEFAULT 'Pending',
    receipt_number TEXT UNIQUE NOT NULL,
    created_at DATE DEFAULT CURRENT_DATE
);

-- Enable RLS for Transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Transactions Policies
DROP POLICY IF EXISTS "Learners can view their own transactions" ON public.transactions;
CREATE POLICY "Learners can view their own transactions" ON public.transactions
    FOR SELECT USING (auth.email() = learner_email);

DROP POLICY IF EXISTS "Learners can record transactions" ON public.transactions;
CREATE POLICY "Learners can record transactions" ON public.transactions
    FOR INSERT WITH CHECK (auth.email() = learner_email OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Admins can do everything on transactions" ON public.transactions;
CREATE POLICY "Admins can do everything on transactions" ON public.transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid() AND (public.profiles.role = 'admin' OR public.profiles.role = 'super_admin')
        )
    );


-- 6. Create Certificates Table
CREATE TABLE IF NOT EXISTS public.certificates (
    id TEXT PRIMARY KEY,
    learner_name TEXT NOT NULL,
    learner_email TEXT NOT NULL,
    course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
    course_title TEXT NOT NULL,
    issue_date DATE DEFAULT CURRENT_DATE,
    status TEXT CHECK (status IN ('Issued', 'Revoked')) DEFAULT 'Issued'
);

-- Enable RLS for Certificates
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Certificates Policies
DROP POLICY IF EXISTS "Certificates are publicly viewable for verification" ON public.certificates;
CREATE POLICY "Certificates are publicly viewable for verification" ON public.certificates
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage certificates" ON public.certificates;
CREATE POLICY "Admins can manage certificates" ON public.certificates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid() AND (public.profiles.role = 'admin' OR public.profiles.role = 'super_admin')
        )
    );


-- 7. Create Corporate Leads Table
CREATE TABLE IF NOT EXISTS public.corporate_leads (
    id TEXT PRIMARY KEY DEFAULT 'lead-' || encode(gen_random_bytes(6), 'hex'),
    organisation TEXT NOT NULL,
    sector TEXT,
    contact_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    thematic_area TEXT,
    participants INTEGER DEFAULT 0,
    delivery_mode TEXT NOT NULL,
    preferred_date DATE,
    need TEXT,
    stage TEXT CHECK (stage IN ('New', 'Contacted', 'Proposal Sent', 'Negotiation', 'Won', 'Lost')) DEFAULT 'New',
    created_at DATE DEFAULT CURRENT_DATE
);

-- Enable RLS for Corporate Leads
ALTER TABLE public.corporate_leads ENABLE ROW LEVEL SECURITY;

-- Corporate Leads Policies
DROP POLICY IF EXISTS "Anyone can submit a corporate lead" ON public.corporate_leads;
CREATE POLICY "Anyone can submit a corporate lead" ON public.corporate_leads
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view and manage corporate leads" ON public.corporate_leads;
CREATE POLICY "Admins can view and manage corporate leads" ON public.corporate_leads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid() AND (public.profiles.role = 'admin' OR public.profiles.role = 'super_admin')
        )
    );


-- 8. Create Programme Applications Table
CREATE TABLE IF NOT EXISTS public.programme_applications (
    id TEXT PRIMARY KEY DEFAULT 'app-' || encode(gen_random_bytes(6), 'hex'),
    programme_type TEXT NOT NULL,
    applicant_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    location TEXT,
    organisation TEXT,
    motivation TEXT,
    status TEXT CHECK (status IN ('Submitted', 'Under Review', 'Shortlisted', 'Rejected', 'Accepted', 'Waitlisted')) DEFAULT 'Submitted',
    score NUMERIC DEFAULT 0,
    created_at DATE DEFAULT CURRENT_DATE
);

-- Enable RLS for Programme Applications
ALTER TABLE public.programme_applications ENABLE ROW LEVEL SECURITY;

-- Programme Applications Policies
DROP POLICY IF EXISTS "Anyone can submit an application" ON public.programme_applications;
CREATE POLICY "Anyone can submit an application" ON public.programme_applications
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Applicants can view their own applications" ON public.programme_applications;
CREATE POLICY "Applicants can view their own applications" ON public.programme_applications
    FOR SELECT USING (auth.email() = email);

DROP POLICY IF EXISTS "Admins can manage programme applications" ON public.programme_applications;
CREATE POLICY "Admins can manage programme applications" ON public.programme_applications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid() AND (public.profiles.role = 'admin' OR public.profiles.role = 'super_admin')
        )
    );


-- 9. Create CMS Assets Table
CREATE TABLE IF NOT EXISTS public.cms_assets (
    id TEXT PRIMARY KEY DEFAULT 'asset-' || encode(gen_random_bytes(6), 'hex'),
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('Banner', 'Flyer', 'Brochure', 'Video', 'Testimonial')) NOT NULL,
    placement TEXT,
    owner TEXT DEFAULT 'Content Manager',
    status TEXT CHECK (status IN ('Draft', 'Scheduled', 'Published')) DEFAULT 'Draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for CMS Assets
ALTER TABLE public.cms_assets ENABLE ROW LEVEL SECURITY;

-- CMS Assets Policies
DROP POLICY IF EXISTS "CMS Assets are viewable by everyone" ON public.cms_assets;
CREATE POLICY "CMS Assets are viewable by everyone" ON public.cms_assets
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage CMS assets" ON public.cms_assets;
CREATE POLICY "Admins can manage CMS assets" ON public.cms_assets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid() AND (public.profiles.role = 'admin' OR public.profiles.role = 'super_admin')
        )
    );


-- 10. Automatically Create Profile on Signup Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email,
        'learner'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
