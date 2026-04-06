-- Clean up duplicate user roles using ctid (internal postgres record pointer)
DELETE FROM public.user_roles a
USING public.user_roles b
WHERE a.user_id = b.user_id 
AND a.role = b.role 
AND a.ctid < b.ctid;
