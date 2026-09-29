-- Prevent concurrent payment callbacks from creating duplicate enrolments.
CREATE UNIQUE INDEX IF NOT EXISTS enrollments_course_learner_unique
  ON public.enrollments (course_id, lower(learner_email));
