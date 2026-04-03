-- Allow admins to update user profiles (specifically to update department_id)
CREATE POLICY "Admins can update profiles" 
  ON public.profiles 
  FOR UPDATE 
  TO authenticated 
  USING (has_role(auth.uid(), 'admin'::app_role));
