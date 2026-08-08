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
