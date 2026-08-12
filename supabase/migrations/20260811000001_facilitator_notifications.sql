-- Allow facilitators to send (insert) notifications (e.g. for grading or announcements)
DROP POLICY IF EXISTS "Facilitators can insert notifications" ON public.notifications;
CREATE POLICY "Facilitators can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role = 'facilitator')
    );
