-- LANI Academy — Supabase Database Schema (single source of truth)
-- Paste this entire script into the Supabase SQL Editor and run it.
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE / DROP ... IF EXISTS.
-- Requires the pgcrypto extension for gen_random_bytes().

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
    intro_video_url TEXT,
    cv_url TEXT,
    country TEXT,
    state_region TEXT,
    city TEXT,
    gender TEXT,
    date_of_birth DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Backfill columns for existing deployments (idempotent)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS intro_video_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cv_url TEXT;

-- Enable RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
-- Helper: is the caller staff? SECURITY DEFINER avoids RLS recursion.
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'facilitator')
  );
$$;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by owner, staff, or if facilitator" ON public.profiles;
CREATE POLICY "Profiles are viewable by owner, staff, or if facilitator" ON public.profiles
    FOR SELECT USING (
        auth.uid() = id
        OR role = 'facilitator'
        OR public.is_staff()
    );

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);


-- 3. Create Courses Table
CREATE TABLE IF NOT EXISTS public.courses (
    id TEXT PRIMARY KEY, -- human readable string identifier e.g., 'digital-transformation-officer'
    title TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    category TEXT,
    thematic_area TEXT,
    type TEXT CHECK (type IN ('Open Programme', 'Certification Preparatory Class', 'Bootcamp', 'Corporate', 'Sponsored')),
    level TEXT CHECK (level IN ('Foundation', 'Intermediate', 'Advanced', 'Executive', 'PT1', 'PT2', 'Others')),
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

-- Learner self-insert removed (audit C2): enrolments are created server-side by
-- the `enroll` Edge Function (service role) after payment verification.
DROP POLICY IF EXISTS "Learners can insert their own enrollments" ON public.enrollments;

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

-- Facilitators may view enrollments for the courses they are assigned to
-- (powers Avg. Completion + Learner Progress on the Facilitator Dashboard).
DROP POLICY IF EXISTS "Facilitators can view enrollments for assigned courses" ON public.enrollments;
CREATE POLICY "Facilitators can view enrollments for assigned courses" ON public.enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.facilitator_assignments fa
            WHERE fa.course_id = public.enrollments.course_id
              AND fa.facilitator_email = auth.email()
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

-- Bank transfer metadata (learner-submitted proof of payment)
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS depositor_name TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS source_bank TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS transfer_reference TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS receipt_url TEXT;

-- Enable RLS for Transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Transactions Policies
DROP POLICY IF EXISTS "Learners can view their own transactions" ON public.transactions;
CREATE POLICY "Learners can view their own transactions" ON public.transactions
    FOR SELECT USING (auth.email() = learner_email);

-- Learner self-insert removed (audit C2): transactions are recorded server-side
-- by the `enroll` Edge Function (service role) after payment verification.
DROP POLICY IF EXISTS "Learners can record transactions" ON public.transactions;

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
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
$$;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
-- 11. Quizzes Table
CREATE TABLE IF NOT EXISTS public.quizzes (
    id TEXT PRIMARY KEY DEFAULT 'quiz-' || encode(gen_random_bytes(6), 'hex'),
    course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
    course_title TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    questions JSONB DEFAULT '[]', -- Array of {id, question, options, correctIndex}
    passing_score INTEGER DEFAULT 0,
    time_limit_minutes INTEGER DEFAULT 0,
    due_date DATE
);

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Quizzes are viewable by enrolled learners" ON public.quizzes;
CREATE POLICY "Quizzes are viewable by enrolled learners" ON public.quizzes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins and facilitators can manage quizzes" ON public.quizzes;
CREATE POLICY "Admins and facilitators can manage quizzes" ON public.quizzes FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role IN ('admin', 'super_admin', 'facilitator'))
);

-- 12. Quiz Attempts Table
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id TEXT PRIMARY KEY DEFAULT 'qatt-' || encode(gen_random_bytes(6), 'hex'),
    quiz_id TEXT REFERENCES public.quizzes(id) ON DELETE CASCADE,
    learner_email TEXT NOT NULL,
    learner_name TEXT NOT NULL,
    answers JSONB DEFAULT '[]', -- Array of numbers
    score INTEGER DEFAULT 0,
    passed BOOLEAN DEFAULT false,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Learners can view their own attempts" ON public.quiz_attempts;
CREATE POLICY "Learners can view their own attempts" ON public.quiz_attempts FOR SELECT USING (auth.email() = learner_email);
DROP POLICY IF EXISTS "Learners can insert attempts" ON public.quiz_attempts;
CREATE POLICY "Learners can insert attempts" ON public.quiz_attempts FOR INSERT WITH CHECK (auth.email() = learner_email);
DROP POLICY IF EXISTS "Admins and facilitators can view all attempts" ON public.quiz_attempts;
CREATE POLICY "Admins and facilitators can view all attempts" ON public.quiz_attempts FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role IN ('admin', 'super_admin', 'facilitator'))
);

-- 13. Assignments Table
CREATE TABLE IF NOT EXISTS public.assignments (
    id TEXT PRIMARY KEY DEFAULT 'asgn-' || encode(gen_random_bytes(6), 'hex'),
    course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
    course_title TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    max_score INTEGER DEFAULT 100
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Assignments are viewable by everyone" ON public.assignments;
CREATE POLICY "Assignments are viewable by everyone" ON public.assignments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins and facilitators can manage assignments" ON public.assignments;
CREATE POLICY "Admins and facilitators can manage assignments" ON public.assignments FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role IN ('admin', 'super_admin', 'facilitator'))
);

-- 14. Assignment Submissions Table
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
    id TEXT PRIMARY KEY DEFAULT 'sub-' || encode(gen_random_bytes(6), 'hex'),
    assignment_id TEXT REFERENCES public.assignments(id) ON DELETE CASCADE,
    course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
    learner_email TEXT NOT NULL,
    learner_name TEXT NOT NULL,
    content TEXT NOT NULL,
    score INTEGER,
    feedback TEXT,
    status TEXT CHECK (status IN ('Submitted', 'Graded', 'Returned')) DEFAULT 'Submitted',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Learners can view their own submissions" ON public.assignment_submissions;
CREATE POLICY "Learners can view their own submissions" ON public.assignment_submissions FOR SELECT USING (auth.email() = learner_email);
DROP POLICY IF EXISTS "Learners can insert submissions" ON public.assignment_submissions;
CREATE POLICY "Learners can insert submissions" ON public.assignment_submissions FOR INSERT WITH CHECK (auth.email() = learner_email);
DROP POLICY IF EXISTS "Admins and facilitators can update submissions" ON public.assignment_submissions;
CREATE POLICY "Admins and facilitators can update submissions" ON public.assignment_submissions FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role IN ('admin', 'super_admin', 'facilitator'))
);
DROP POLICY IF EXISTS "Admins and facilitators can view submissions" ON public.assignment_submissions;
CREATE POLICY "Admins and facilitators can view submissions" ON public.assignment_submissions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role IN ('admin', 'super_admin', 'facilitator'))
);

-- 15. Announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
    id TEXT PRIMARY KEY DEFAULT 'ann-' || encode(gen_random_bytes(6), 'hex'),
    course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
    course_title TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_role TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Announcements are viewable by everyone" ON public.announcements;
CREATE POLICY "Announcements are viewable by everyone" ON public.announcements FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins and facilitators can manage announcements" ON public.announcements;
CREATE POLICY "Admins and facilitators can manage announcements" ON public.announcements FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role IN ('admin', 'super_admin', 'facilitator'))
);

-- 16. Calendar Events Table
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id TEXT PRIMARY KEY DEFAULT 'evt-' || encode(gen_random_bytes(6), 'hex'),
    course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
    course_title TEXT NOT NULL,
    title TEXT NOT NULL,
    type TEXT CHECK (type IN ('Live Class', 'Assessment Deadline', 'Workshop', 'Orientation', 'Webinar')) NOT NULL,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    venue TEXT NOT NULL,
    meeting_link TEXT
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Calendar events are viewable by everyone" ON public.calendar_events;
CREATE POLICY "Calendar events are viewable by everyone" ON public.calendar_events FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins and facilitators can manage calendar events" ON public.calendar_events;
CREATE POLICY "Admins and facilitators can manage calendar events" ON public.calendar_events FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role IN ('admin', 'super_admin', 'facilitator'))
);

-- 17. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY DEFAULT 'notif-' || encode(gen_random_bytes(6), 'hex'),
    learner_email TEXT, -- If null, it's a broadcast
    type TEXT CHECK (type IN ('enrollment', 'payment', 'certificate', 'announcement', 'assessment', 'reminder')) NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their notifications or broadcasts" ON public.notifications;
CREATE POLICY "Users can view their notifications or broadcasts" ON public.notifications FOR SELECT USING (auth.email() = learner_email OR learner_email IS NULL);
DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;
CREATE POLICY "Users can update their notifications" ON public.notifications FOR UPDATE USING (auth.email() = learner_email);
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;
CREATE POLICY "Admins can manage notifications" ON public.notifications FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role IN ('admin', 'super_admin'))
);

-- 18. Facilitator Assignments Table
CREATE TABLE IF NOT EXISTS public.facilitator_assignments (
    facilitator_email TEXT NOT NULL,
    facilitator_name TEXT NOT NULL,
    course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
    course_title TEXT NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (facilitator_email, course_id)
);

ALTER TABLE public.facilitator_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Facilitator assignments are viewable by everyone" ON public.facilitator_assignments;
CREATE POLICY "Facilitator assignments are viewable by everyone" ON public.facilitator_assignments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage facilitator assignments" ON public.facilitator_assignments;
CREATE POLICY "Admins can manage facilitator assignments" ON public.facilitator_assignments FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role IN ('admin', 'super_admin'))
);


-- ============================================================
-- 19. Media storage (creative assets, brochures, materials)
-- ============================================================
-- Public "media" bucket + access policies, and a url column on cms_assets.
ALTER TABLE public.cms_assets ADD COLUMN IF NOT EXISTS url TEXT;

-- Course intro video + downloadable material files
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS material_files JSONB DEFAULT '[]';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS sequential BOOLEAN DEFAULT false;

INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read media" ON storage.objects;
CREATE POLICY "Public read media" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');

DROP POLICY IF EXISTS "Authenticated upload media" ON storage.objects;
CREATE POLICY "Authenticated upload media" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "Authenticated update media" ON storage.objects;
CREATE POLICY "Authenticated update media" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'media');

DROP POLICY IF EXISTS "Admins delete media" ON storage.objects;
CREATE POLICY "Admins delete media" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'media'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid()
        AND public.profiles.role IN ('admin', 'super_admin')
    )
  );

-- ============================================================
-- 20. Engagement (promo codes, wishlists, newsletter, surveys)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.promo_codes (
  code TEXT PRIMARY KEY,
  description TEXT,
  discount_percent INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  expires_at DATE,
  max_uses INTEGER DEFAULT 0,
  uses INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Promo codes are readable" ON public.promo_codes;
CREATE POLICY "Promo codes are readable" ON public.promo_codes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage promo codes" ON public.promo_codes;
CREATE POLICY "Admins manage promo codes" ON public.promo_codes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role IN ('admin','super_admin'))
);

CREATE TABLE IF NOT EXISTS public.wishlists (
  learner_email TEXT NOT NULL,
  course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (learner_email, course_id)
);
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view their wishlist" ON public.wishlists;
CREATE POLICY "Users view their wishlist" ON public.wishlists FOR SELECT USING (auth.email() = learner_email);
DROP POLICY IF EXISTS "Users add to their wishlist" ON public.wishlists;
CREATE POLICY "Users add to their wishlist" ON public.wishlists FOR INSERT WITH CHECK (auth.email() = learner_email);
DROP POLICY IF EXISTS "Users remove from their wishlist" ON public.wishlists;
CREATE POLICY "Users remove from their wishlist" ON public.wishlists FOR DELETE USING (auth.email() = learner_email);

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins read subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admins read subscribers" ON public.newsletter_subscribers FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role IN ('admin','super_admin'))
);

CREATE TABLE IF NOT EXISTS public.surveys (
  id TEXT PRIMARY KEY,
  course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
  course_title TEXT,
  title TEXT NOT NULL,
  type TEXT CHECK (type IN ('Pre','Post','Feedback')) DEFAULT 'Feedback',
  questions JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Surveys are viewable by everyone" ON public.surveys;
CREATE POLICY "Surveys are viewable by everyone" ON public.surveys FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins and facilitators manage surveys" ON public.surveys;
CREATE POLICY "Admins and facilitators manage surveys" ON public.surveys FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role IN ('admin','super_admin','facilitator'))
);

CREATE TABLE IF NOT EXISTS public.survey_responses (
  id TEXT PRIMARY KEY,
  survey_id TEXT REFERENCES public.surveys(id) ON DELETE CASCADE,
  course_id TEXT,
  learner_email TEXT,
  learner_name TEXT,
  ratings JSONB DEFAULT '[]',
  comment TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Learners submit survey responses" ON public.survey_responses;
CREATE POLICY "Learners submit survey responses" ON public.survey_responses FOR INSERT WITH CHECK (auth.email() = learner_email);
DROP POLICY IF EXISTS "Learners view their responses" ON public.survey_responses;
CREATE POLICY "Learners view their responses" ON public.survey_responses FOR SELECT USING (auth.email() = learner_email);
DROP POLICY IF EXISTS "Admins and facilitators view responses" ON public.survey_responses;
CREATE POLICY "Admins and facilitators view responses" ON public.survey_responses FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role IN ('admin','super_admin','facilitator'))
);

-- ============================================================
-- 21. Content (articles + downloadable resources)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.content (
  id TEXT PRIMARY KEY,
  type TEXT CHECK (type IN ('Article','Guide','Brochure','Flyer')) DEFAULT 'Article',
  title TEXT NOT NULL,
  excerpt TEXT,
  body TEXT,
  category TEXT,
  image_url TEXT,
  file_url TEXT,
  author TEXT,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Published content is public" ON public.content;
CREATE POLICY "Published content is public" ON public.content FOR SELECT USING (
  published = true
  OR EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role IN ('admin','super_admin'))
);
DROP POLICY IF EXISTS "Admins manage content" ON public.content;
CREATE POLICY "Admins manage content" ON public.content FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role IN ('admin','super_admin'))
);

-- ============================================================
-- 22. Session attendance
-- ============================================================
CREATE TABLE IF NOT EXISTS public.attendance (
  session_id TEXT REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  learner_email TEXT NOT NULL,
  learner_name TEXT,
  course_id TEXT,
  status TEXT CHECK (status IN ('Present','Absent')) DEFAULT 'Present',
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (session_id, learner_email)
);
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Learners view their attendance" ON public.attendance;
CREATE POLICY "Learners view their attendance" ON public.attendance FOR SELECT USING (auth.email() = learner_email);
DROP POLICY IF EXISTS "Staff view attendance" ON public.attendance;
CREATE POLICY "Staff view attendance" ON public.attendance FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role IN ('admin','super_admin','facilitator'))
);
DROP POLICY IF EXISTS "Staff manage attendance" ON public.attendance;
CREATE POLICY "Staff manage attendance" ON public.attendance FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role IN ('admin','super_admin','facilitator'))
);

-- ============================================================
-- 23. Application attachments + certificate categories
-- ============================================================
ALTER TABLE public.programme_applications ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Completion';

-- ============================================================
-- 24. Course discussion forums
-- ============================================================
CREATE TABLE IF NOT EXISTS public.discussions (
  id TEXT PRIMARY KEY,
  course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
  course_title TEXT,
  author_email TEXT NOT NULL,
  author_name TEXT,
  author_role TEXT,
  body TEXT NOT NULL,
  parent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View course discussions" ON public.discussions;
CREATE POLICY "View course discussions" ON public.discussions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.enrollments e WHERE e.course_id = public.discussions.course_id AND e.learner_email = auth.email())
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('facilitator','admin','super_admin'))
);
DROP POLICY IF EXISTS "Post course discussions" ON public.discussions;
CREATE POLICY "Post course discussions" ON public.discussions FOR INSERT WITH CHECK (
  author_email = auth.email() AND (
    EXISTS (SELECT 1 FROM public.enrollments e WHERE e.course_id = public.discussions.course_id AND e.learner_email = auth.email())
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('facilitator','admin','super_admin'))
  )
);
DROP POLICY IF EXISTS "Delete own or staff discussions" ON public.discussions;
CREATE POLICY "Delete own or staff discussions" ON public.discussions FOR DELETE USING (
  author_email = auth.email()
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('facilitator','admin','super_admin'))
);

-- ============================================================
-- 25. Learning pathways / course bundles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pathways (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image TEXT,
  course_ids JSONB DEFAULT '[]',
  price NUMERIC DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.pathways ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Published pathways are public" ON public.pathways;
CREATE POLICY "Published pathways are public" ON public.pathways FOR SELECT USING (
  published = true
  OR EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role IN ('admin','super_admin'))
);
DROP POLICY IF EXISTS "Admins manage pathways" ON public.pathways;
CREATE POLICY "Admins manage pathways" ON public.pathways FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role IN ('admin','super_admin'))
);

-- ============================================================
-- Subject Matter Experts (landing page + admin managed)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.smes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT,
  expertise TEXT,
  bio TEXT,
  image TEXT,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.smes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Published smes are public" ON public.smes;
CREATE POLICY "Published smes are public" ON public.smes FOR SELECT USING (
  published = true
  OR EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role IN ('admin','super_admin'))
);
DROP POLICY IF EXISTS "Admins manage smes" ON public.smes;
CREATE POLICY "Admins manage smes" ON public.smes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role IN ('admin','super_admin'))
);

-- ============================================================
-- 26. Analytics events (views, checkout funnel)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  course_id TEXT,
  learner_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can log events" ON public.analytics_events;
CREATE POLICY "Anyone can log events" ON public.analytics_events FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins read events" ON public.analytics_events;
CREATE POLICY "Admins read events" ON public.analytics_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role IN ('admin','super_admin'))
);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON public.analytics_events(type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_course ON public.analytics_events(course_id);

-- ============================================================
-- 27. Secure role assignment (prevents privilege escalation)
-- ============================================================
-- LANI Academy — Secure role assignment
-- Prevents privilege escalation: a signed-in API user may self-select the
-- non-privileged roles (learner, facilitator, organization) but can NEVER
-- grant themselves 'admin' or 'super_admin'. Only existing admins may do that.
-- Trusted server-side / SQL-Editor operations (no auth context, i.e.
-- auth.uid() IS NULL, which already requires the service role and passes RLS)
-- are allowed through so the first admin can be bootstrapped.
-- This enforces role-based security at the database layer, independent of the client.

CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- Block ANY self-service role change. Only admins/super_admins (or the
  -- server via service role, where auth.uid() is null) may change a role.
  IF NEW.role IS DISTINCT FROM OLD.role AND auth.uid() IS NOT NULL THEN
    SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
    IF caller_role IS DISTINCT FROM 'admin' AND caller_role IS DISTINCT FROM 'super_admin' THEN
      RAISE EXCEPTION 'Not permitted to change account role.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_role_escalation ON public.profiles;
CREATE TRIGGER enforce_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.prevent_role_escalation();

-- Optional: seed your first super admin (run once, replace the email).
-- UPDATE public.profiles SET role = 'super_admin' WHERE email = 'you@lani.ng';


-- ============================================================
-- 28. Corporate (organization) access to sponsored learners
-- ============================================================
-- Lets an 'organization' account enrol staff and see the progress of the
-- learners it sponsored. Access is scoped to the org's own name, matched
-- against enrollments.sponsor_organisation.

-- Return the caller's organisation name (only for organization accounts).
-- SECURITY DEFINER so the policy can read profiles without RLS recursion.
CREATE OR REPLACE FUNCTION public.current_org()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT organisation FROM public.profiles
  WHERE id = auth.uid() AND role = 'organization'
  LIMIT 1;
$$;

-- Enrollments: an org can view + create rows sponsored under its own name.
DROP POLICY IF EXISTS "Organizations can view their sponsored enrollments" ON public.enrollments;
CREATE POLICY "Organizations can view their sponsored enrollments" ON public.enrollments
  FOR SELECT USING (
    sponsor_organisation IS NOT NULL
    AND sponsor_organisation = public.current_org()
  );

DROP POLICY IF EXISTS "Organizations can sponsor enrollments" ON public.enrollments;
CREATE POLICY "Organizations can sponsor enrollments" ON public.enrollments
  FOR INSERT WITH CHECK (
    sponsor_organisation IS NOT NULL
    AND sponsor_organisation = public.current_org()
  );

-- Transactions: an org can record + view transactions for its sponsored learners.
DROP POLICY IF EXISTS "Organizations can record sponsored transactions" ON public.transactions;
CREATE POLICY "Organizations can record sponsored transactions" ON public.transactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.course_id = transactions.course_id
        AND e.learner_email = transactions.learner_email
        AND e.sponsor_organisation = public.current_org()
    )
  );

DROP POLICY IF EXISTS "Organizations can view sponsored transactions" ON public.transactions;
CREATE POLICY "Organizations can view sponsored transactions" ON public.transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.course_id = transactions.course_id
        AND e.learner_email = transactions.learner_email
        AND e.sponsor_organisation = public.current_org()
    )
  );


-- 29. Course ratings & reviews
-- ============================================================
-- Learners who are enrolled in a course can leave one star rating + comment.
-- Reviews are publicly readable so average ratings can show on course cards.

CREATE TABLE IF NOT EXISTS public.course_reviews (
    id TEXT PRIMARY KEY DEFAULT 'rev-' || substr(md5(random()::text || clock_timestamp()::text), 1, 12),
    course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
    learner_email TEXT NOT NULL,
    learner_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (course_id, learner_email)
);

ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reviews are publicly viewable" ON public.course_reviews;
CREATE POLICY "Reviews are publicly viewable" ON public.course_reviews
    FOR SELECT USING (true);

-- A learner may review a course only if they are enrolled in it.
DROP POLICY IF EXISTS "Enrolled learners can write reviews" ON public.course_reviews;
CREATE POLICY "Enrolled learners can write reviews" ON public.course_reviews
    FOR INSERT WITH CHECK (
        auth.email() = learner_email
        AND EXISTS (
            SELECT 1 FROM public.enrollments e
            WHERE e.course_id = course_reviews.course_id
              AND e.learner_email = auth.email()
        )
    );

DROP POLICY IF EXISTS "Learners can update their own review" ON public.course_reviews;
CREATE POLICY "Learners can update their own review" ON public.course_reviews
    FOR UPDATE USING (auth.email() = learner_email);

DROP POLICY IF EXISTS "Learners can delete their own review" ON public.course_reviews;
CREATE POLICY "Learners can delete their own review" ON public.course_reviews
    FOR DELETE USING (auth.email() = learner_email);

DROP POLICY IF EXISTS "Admins can manage reviews" ON public.course_reviews;
CREATE POLICY "Admins can manage reviews" ON public.course_reviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid()
              AND (public.profiles.role = 'admin' OR public.profiles.role = 'super_admin')
        )
    );

CREATE INDEX IF NOT EXISTS idx_course_reviews_course ON public.course_reviews (course_id);


-- 30. Lesson bookmarks & notes
-- ============================================================
-- Private, per-learner notes and bookmarks attached to a lesson within a course.
-- Owner-only visibility.

CREATE TABLE IF NOT EXISTS public.lesson_notes (
    id TEXT PRIMARY KEY DEFAULT 'note-' || substr(md5(random()::text || clock_timestamp()::text), 1, 12),
    learner_email TEXT NOT NULL,
    course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
    lesson_title TEXT NOT NULL,
    body TEXT DEFAULT '',
    bookmarked BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (learner_email, course_id, lesson_title)
);

ALTER TABLE public.lesson_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Learners manage their own notes" ON public.lesson_notes;
CREATE POLICY "Learners manage their own notes" ON public.lesson_notes
    FOR ALL USING (auth.email() = learner_email)
    WITH CHECK (auth.email() = learner_email);

CREATE INDEX IF NOT EXISTS idx_lesson_notes_owner ON public.lesson_notes (learner_email, course_id);


-- 31. Admin audit log
-- ============================================================
-- Records privileged actions (role changes, course edits/archives, cert revokes,
-- broadcasts, etc.). Any authenticated user can append; only admins can read.

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY DEFAULT 'aud-' || substr(md5(random()::text || clock_timestamp()::text), 1, 12),
    actor_email TEXT,
    actor_role TEXT,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    detail TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Append-only for any signed-in user (actions are logged from the app).
DROP POLICY IF EXISTS "Authenticated can append audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated can append audit logs" ON public.audit_logs
    FOR INSERT TO authenticated WITH CHECK (true);

-- Only admins can read the log.
DROP POLICY IF EXISTS "Admins can read audit logs" ON public.audit_logs;
CREATE POLICY "Admins can read audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid()
              AND (public.profiles.role = 'admin' OR public.profiles.role = 'super_admin')
        )
    );

CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs (created_at DESC);


-- 32. Learner activity (backend login/activity streak)
-- ============================================================
-- One row per learner per active day. Used to compute a cross-device
-- learning streak. Owner-only; admins may read for analytics.

CREATE TABLE IF NOT EXISTS public.learner_activity (
    learner_email TEXT NOT NULL,
    activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (learner_email, activity_date)
);

ALTER TABLE public.learner_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Learners manage their own activity" ON public.learner_activity;
CREATE POLICY "Learners manage their own activity" ON public.learner_activity
    FOR ALL USING (auth.email() = learner_email)
    WITH CHECK (auth.email() = learner_email);

DROP POLICY IF EXISTS "Admins can read activity" ON public.learner_activity;
CREATE POLICY "Admins can read activity" ON public.learner_activity
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid()
              AND (public.profiles.role = 'admin' OR public.profiles.role = 'super_admin')
        )
    );


-- ============================================================
-- 34. Server-side email OTP store (backs real 2FA) — 2026-08-09
-- ============================================================
-- Codes stored hashed. RLS enabled with NO policies = deny all clients;
-- only the auth-otp Edge Function (service role) touches this table.
CREATE TABLE IF NOT EXISTS public.email_otps (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    consumed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_otps_lookup ON public.email_otps (email, expires_at);

ALTER TABLE public.email_otps ENABLE ROW LEVEL SECURITY;
