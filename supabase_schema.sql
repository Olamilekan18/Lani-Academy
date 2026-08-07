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
CREATE POLICY "Learners can insert attempts" ON public.quiz_attempts FOR INSERT WITH CHECK (auth.email() = learner_email OR auth.uid() IS NULL);
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
CREATE POLICY "Learners can insert submissions" ON public.assignment_submissions FOR INSERT WITH CHECK (auth.email() = learner_email OR auth.uid() IS NULL);
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
-- 19. Secure role assignment (prevents privilege escalation)
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
RETURNS TRIGGER AS $$
DECLARE
  caller_role TEXT;
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND NEW.role IN ('admin', 'super_admin')
     AND auth.uid() IS NOT NULL THEN
    SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
    IF caller_role IS DISTINCT FROM 'admin' AND caller_role IS DISTINCT FROM 'super_admin' THEN
      RAISE EXCEPTION 'Not permitted to assign administrative roles.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_role_escalation ON public.profiles;
CREATE TRIGGER enforce_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.prevent_role_escalation();

-- Optional: seed your first super admin (run once, replace the email).
-- UPDATE public.profiles SET role = 'super_admin' WHERE email = 'you@lani.ng';
