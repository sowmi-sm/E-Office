-- Create departments table
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  head_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on departments
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- RLS policies for departments (admins can manage, others can view)
CREATE POLICY "Admins can manage departments"
ON public.departments
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view departments"
ON public.departments
FOR SELECT
TO authenticated
USING (true);

-- Create kpi_templates table
CREATE TABLE public.kpi_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL DEFAULT 'number',
  target_value NUMERIC,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on kpi_templates
ALTER TABLE public.kpi_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for kpi_templates (admins can manage, others can view)
CREATE POLICY "Admins can manage kpi_templates"
ON public.kpi_templates
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view kpi_templates"
ON public.kpi_templates
FOR SELECT
TO authenticated
USING (true);

-- Add triggers for updated_at
CREATE TRIGGER update_departments_updated_at
BEFORE UPDATE ON public.departments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_kpi_templates_updated_at
BEFORE UPDATE ON public.kpi_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();