-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
    link TEXT, -- Optional link to redirect the user
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- System/Admins can insert notifications
CREATE POLICY "Admins can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Grant access to authenticated users
GRANT ALL ON TABLE public.notifications TO authenticated;

-- Function to notify on task assignment
CREATE OR REPLACE FUNCTION public.notify_on_task_assignment()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') OR (OLD.assigned_to IS DISTINCT FROM NEW.assigned_to) THEN
        INSERT INTO public.notifications (user_id, title, message, type, link)
        VALUES (
            NEW.assigned_to,
            'New Task Assigned',
            'You have been assigned a new task: ' || NEW.title,
            'info',
            '/tasks'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for task assignment
DROP TRIGGER IF EXISTS tr_notify_on_task_assignment ON public.tasks;
CREATE TRIGGER tr_notify_on_task_assignment
    AFTER INSERT OR UPDATE OF assigned_to ON public.tasks
    FOR EACH ROW
    WHEN (NEW.assigned_to IS NOT NULL)
    EXECUTE FUNCTION public.notify_on_task_assignment();

-- Function to notify on project manager assignment
CREATE OR REPLACE FUNCTION public.notify_on_project_manager_assignment()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') OR (OLD.manager_id IS DISTINCT FROM NEW.manager_id) THEN
        INSERT INTO public.notifications (user_id, title, message, type, link)
        VALUES (
            NEW.manager_id,
            'New Project Assigned',
            'You have been assigned as the manager for project: ' || NEW.name,
            'success',
            '/projects'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for project manager assignment
DROP TRIGGER IF EXISTS tr_notify_on_project_manager_assignment ON public.projects;
CREATE TRIGGER tr_notify_on_project_manager_assignment
    AFTER INSERT OR UPDATE OF manager_id ON public.projects
    FOR EACH ROW
    WHEN (NEW.manager_id IS NOT NULL)
    EXECUTE FUNCTION public.notify_on_project_manager_assignment();
