-- Create teams table for organizational structure
CREATE TABLE public.teams (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    leader_id UUID,  -- References profiles.id
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create team_members junction table
CREATE TABLE public.team_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,  -- References profiles.id
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(team_id, user_id)
);

-- Create projects table
CREATE TABLE public.projects (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    manager_id UUID,  -- References profiles.id
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
    start_date DATE,
    end_date DATE,
    budget NUMERIC,
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tasks table with proper ownership
CREATE TABLE public.tasks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    assigned_to UUID NOT NULL,  -- References profiles.id (the staff member)
    created_by UUID NOT NULL,  -- References profiles.id (the assigner)
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue', 'cancelled')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_kpis table for individual KPI tracking
CREATE TABLE public.user_kpis (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,  -- The staff member
    kpi_template_id UUID REFERENCES public.kpi_templates(id) ON DELETE CASCADE,
    current_value NUMERIC NOT NULL DEFAULT 0,
    target_value NUMERIC NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'on_track' CHECK (status IN ('on_track', 'at_risk', 'behind', 'exceeded')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create performance_records table
CREATE TABLE public.performance_records (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,  -- The employee being evaluated
    evaluator_id UUID NOT NULL,  -- The officer/admin evaluating
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    kpi_score NUMERIC NOT NULL DEFAULT 0 CHECK (kpi_score >= 0 AND kpi_score <= 100),  -- 70% weight
    supervisor_feedback_score NUMERIC NOT NULL DEFAULT 0 CHECK (supervisor_feedback_score >= 0 AND supervisor_feedback_score <= 100),  -- 30% weight
    overall_score NUMERIC GENERATED ALWAYS AS ((kpi_score * 0.7) + (supervisor_feedback_score * 0.3)) STORED,
    comments TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, period_start, period_end)
);

-- Add department_id to profiles for organizational mapping
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

-- Enable RLS on all new tables
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_records ENABLE ROW LEVEL SECURITY;

-- Create helper function to check if user is officer or above
CREATE OR REPLACE FUNCTION public.is_officer_or_above(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'reporting_officer', 'project_manager', 'division_head', 'top_management')
  )
$$;

-- Create helper function to check if users are in the same team
CREATE OR REPLACE FUNCTION public.is_team_member(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = _team_id AND user_id = _user_id
  )
$$;

-- Create helper function to get user's team IDs
CREATE OR REPLACE FUNCTION public.get_user_team_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT team_id FROM public.team_members WHERE user_id = _user_id
$$;

-- TEAMS RLS Policies
CREATE POLICY "Admins can manage teams" ON public.teams
    FOR ALL USING (has_role(auth.uid(), 'admin'))
    WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Officers can view teams" ON public.teams
    FOR SELECT USING (is_officer_or_above(auth.uid()));

CREATE POLICY "Staff can view their own teams" ON public.teams
    FOR SELECT USING (
        id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
    );

-- TEAM_MEMBERS RLS Policies
CREATE POLICY "Admins can manage team members" ON public.team_members
    FOR ALL USING (has_role(auth.uid(), 'admin'))
    WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Officers can view team members" ON public.team_members
    FOR SELECT USING (is_officer_or_above(auth.uid()));

CREATE POLICY "Staff can view their own team membership" ON public.team_members
    FOR SELECT USING (user_id = auth.uid());

-- PROJECTS RLS Policies
CREATE POLICY "Admins can manage all projects" ON public.projects
    FOR ALL USING (has_role(auth.uid(), 'admin'))
    WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Officers can view all projects" ON public.projects
    FOR SELECT USING (is_officer_or_above(auth.uid()));

CREATE POLICY "Project managers can manage their projects" ON public.projects
    FOR ALL USING (manager_id = auth.uid())
    WITH CHECK (manager_id = auth.uid());

CREATE POLICY "Staff can view projects they have tasks in" ON public.projects
    FOR SELECT USING (
        id IN (SELECT DISTINCT project_id FROM public.tasks WHERE assigned_to = auth.uid())
    );

-- TASKS RLS Policies
CREATE POLICY "Admins can manage all tasks" ON public.tasks
    FOR ALL USING (has_role(auth.uid(), 'admin'))
    WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Officers can view team tasks" ON public.tasks
    FOR SELECT USING (is_officer_or_above(auth.uid()));

CREATE POLICY "Officers can create tasks" ON public.tasks
    FOR INSERT WITH CHECK (is_officer_or_above(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Officers can update tasks they created" ON public.tasks
    FOR UPDATE USING (is_officer_or_above(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Staff can view their own tasks" ON public.tasks
    FOR SELECT USING (assigned_to = auth.uid());

CREATE POLICY "Staff can update their own tasks" ON public.tasks
    FOR UPDATE USING (assigned_to = auth.uid());

-- USER_KPIS RLS Policies
CREATE POLICY "Admins can manage all user KPIs" ON public.user_kpis
    FOR ALL USING (has_role(auth.uid(), 'admin'))
    WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Officers can view all user KPIs" ON public.user_kpis
    FOR SELECT USING (is_officer_or_above(auth.uid()));

CREATE POLICY "Officers can create user KPIs" ON public.user_kpis
    FOR INSERT WITH CHECK (is_officer_or_above(auth.uid()));

CREATE POLICY "Officers can update user KPIs" ON public.user_kpis
    FOR UPDATE USING (is_officer_or_above(auth.uid()));

CREATE POLICY "Staff can view their own KPIs" ON public.user_kpis
    FOR SELECT USING (user_id = auth.uid());

-- PERFORMANCE_RECORDS RLS Policies
CREATE POLICY "Admins can manage all performance records" ON public.performance_records
    FOR ALL USING (has_role(auth.uid(), 'admin'))
    WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Officers can manage performance records" ON public.performance_records
    FOR ALL USING (is_officer_or_above(auth.uid()) AND evaluator_id = auth.uid())
    WITH CHECK (is_officer_or_above(auth.uid()) AND evaluator_id = auth.uid());

CREATE POLICY "Officers can view all performance records" ON public.performance_records
    FOR SELECT USING (is_officer_or_above(auth.uid()));

CREATE POLICY "Staff can view their own performance records" ON public.performance_records
    FOR SELECT USING (user_id = auth.uid());

-- Update profiles RLS to allow admins to view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Officers can view profiles in their department" ON public.profiles
    FOR SELECT USING (
        is_officer_or_above(auth.uid()) AND (
            department_id IN (
                SELECT department_id FROM public.profiles WHERE id = auth.uid()
            ) OR department_id IS NULL
        )
    );

-- Add triggers for updated_at
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_kpis_updated_at BEFORE UPDATE ON public.user_kpis
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_performance_records_updated_at BEFORE UPDATE ON public.performance_records
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();