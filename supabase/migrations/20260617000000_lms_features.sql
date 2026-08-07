-- Required for gen_random_bytes() default IDs below
CREATE EXTENSION IF NOT EXISTS pgcrypto;

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
