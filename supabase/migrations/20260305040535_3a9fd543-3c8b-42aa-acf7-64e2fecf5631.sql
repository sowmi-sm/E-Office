
-- Drop all RESTRICTIVE policies and recreate as PERMISSIVE for all tables

-- TASKS
DROP POLICY IF EXISTS "Admins can manage all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Officers can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Officers can update tasks they created" ON public.tasks;
DROP POLICY IF EXISTS "Officers can view team tasks" ON public.tasks;
DROP POLICY IF EXISTS "Staff can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Staff can view their own tasks" ON public.tasks;

CREATE POLICY "Admins can manage all tasks" ON public.tasks FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Officers can create tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (is_officer_or_above(auth.uid()) AND created_by = auth.uid());
CREATE POLICY "Officers can update tasks they created" ON public.tasks FOR UPDATE TO authenticated USING (is_officer_or_above(auth.uid()) AND created_by = auth.uid());
CREATE POLICY "Officers can view team tasks" ON public.tasks FOR SELECT TO authenticated USING (is_officer_or_above(auth.uid()));
CREATE POLICY "Staff can update their own tasks" ON public.tasks FOR UPDATE TO authenticated USING (assigned_to = auth.uid());
CREATE POLICY "Staff can view their own tasks" ON public.tasks FOR SELECT TO authenticated USING (assigned_to = auth.uid());

-- PROJECTS
DROP POLICY IF EXISTS "Admins can manage all projects" ON public.projects;
DROP POLICY IF EXISTS "Officers can view all projects" ON public.projects;
DROP POLICY IF EXISTS "Project managers can manage their projects" ON public.projects;
DROP POLICY IF EXISTS "Staff can view projects they have tasks in" ON public.projects;

CREATE POLICY "Admins can manage all projects" ON public.projects FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Officers can view all projects" ON public.projects FOR SELECT TO authenticated USING (is_officer_or_above(auth.uid()));
CREATE POLICY "Project managers can manage their projects" ON public.projects FOR ALL TO authenticated USING (manager_id = auth.uid()) WITH CHECK (manager_id = auth.uid());
CREATE POLICY "Staff can view projects they have tasks in" ON public.projects FOR SELECT TO authenticated USING (id IN (SELECT DISTINCT tasks.project_id FROM tasks WHERE tasks.assigned_to = auth.uid()));

-- USER_KPIS
DROP POLICY IF EXISTS "Admins can manage all user KPIs" ON public.user_kpis;
DROP POLICY IF EXISTS "Officers can create user KPIs" ON public.user_kpis;
DROP POLICY IF EXISTS "Officers can update user KPIs" ON public.user_kpis;
DROP POLICY IF EXISTS "Officers can view all user KPIs" ON public.user_kpis;
DROP POLICY IF EXISTS "Staff can view their own KPIs" ON public.user_kpis;

CREATE POLICY "Admins can manage all user KPIs" ON public.user_kpis FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Officers can create user KPIs" ON public.user_kpis FOR INSERT TO authenticated WITH CHECK (is_officer_or_above(auth.uid()));
CREATE POLICY "Officers can update user KPIs" ON public.user_kpis FOR UPDATE TO authenticated USING (is_officer_or_above(auth.uid()));
CREATE POLICY "Officers can view all user KPIs" ON public.user_kpis FOR SELECT TO authenticated USING (is_officer_or_above(auth.uid()));
CREATE POLICY "Staff can view their own KPIs" ON public.user_kpis FOR SELECT TO authenticated USING (user_id = auth.uid());

-- PERFORMANCE_RECORDS
DROP POLICY IF EXISTS "Admins can manage all performance records" ON public.performance_records;
DROP POLICY IF EXISTS "Officers can manage performance records" ON public.performance_records;
DROP POLICY IF EXISTS "Officers can view all performance records" ON public.performance_records;
DROP POLICY IF EXISTS "Staff can view their own performance records" ON public.performance_records;

CREATE POLICY "Admins can manage all performance records" ON public.performance_records FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Officers can manage performance records" ON public.performance_records FOR ALL TO authenticated USING (is_officer_or_above(auth.uid()) AND evaluator_id = auth.uid()) WITH CHECK (is_officer_or_above(auth.uid()) AND evaluator_id = auth.uid());
CREATE POLICY "Officers can view all performance records" ON public.performance_records FOR SELECT TO authenticated USING (is_officer_or_above(auth.uid()));
CREATE POLICY "Staff can view their own performance records" ON public.performance_records FOR SELECT TO authenticated USING (user_id = auth.uid());

-- PROFILES
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Officers can view profiles in their department" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Officers can view profiles in their department" ON public.profiles FOR SELECT TO authenticated USING (is_officer_or_above(auth.uid()) AND (department_id = get_user_department_id(auth.uid()) OR department_id IS NULL));
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);

-- TEAMS
DROP POLICY IF EXISTS "Admins can manage teams" ON public.teams;
DROP POLICY IF EXISTS "Officers can view teams" ON public.teams;
DROP POLICY IF EXISTS "Staff can view their own teams" ON public.teams;

CREATE POLICY "Admins can manage teams" ON public.teams FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Officers can view teams" ON public.teams FOR SELECT TO authenticated USING (is_officer_or_above(auth.uid()));
CREATE POLICY "Staff can view their own teams" ON public.teams FOR SELECT TO authenticated USING (id IN (SELECT team_members.team_id FROM team_members WHERE team_members.user_id = auth.uid()));

-- TEAM_MEMBERS
DROP POLICY IF EXISTS "Admins can manage team members" ON public.team_members;
DROP POLICY IF EXISTS "Officers can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Staff can view their own team membership" ON public.team_members;

CREATE POLICY "Admins can manage team members" ON public.team_members FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Officers can view team members" ON public.team_members FOR SELECT TO authenticated USING (is_officer_or_above(auth.uid()));
CREATE POLICY "Staff can view their own team membership" ON public.team_members FOR SELECT TO authenticated USING (user_id = auth.uid());

-- DEPARTMENTS
DROP POLICY IF EXISTS "Admins can manage departments" ON public.departments;
DROP POLICY IF EXISTS "Authenticated users can view departments" ON public.departments;

CREATE POLICY "Admins can manage departments" ON public.departments FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated users can view departments" ON public.departments FOR SELECT TO authenticated USING (true);

-- KPI_TEMPLATES
DROP POLICY IF EXISTS "Admins can manage kpi_templates" ON public.kpi_templates;
DROP POLICY IF EXISTS "Authenticated users can view kpi_templates" ON public.kpi_templates;

CREATE POLICY "Admins can manage kpi_templates" ON public.kpi_templates FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated users can view kpi_templates" ON public.kpi_templates FOR SELECT TO authenticated USING (true);

-- WORKING_HOURS_CONFIG
DROP POLICY IF EXISTS "Admins can manage working hours config" ON public.working_hours_config;
DROP POLICY IF EXISTS "Authenticated users can view working hours config" ON public.working_hours_config;

CREATE POLICY "Admins can manage working hours config" ON public.working_hours_config FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated users can view working hours config" ON public.working_hours_config FOR SELECT TO authenticated USING (true);

-- USER_ROLES
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own role during signup" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;

CREATE POLICY "Admins can manage user roles" ON public.user_roles FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert their own role during signup" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
