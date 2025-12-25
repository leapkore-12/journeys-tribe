-- Add RLS policy for admins to manage user roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Add RLS policy for admins to update any profile (for plan changes)
CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Add RLS policy for admins to insert roles
CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Add RLS policy for admins to delete roles
CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Insert initial admin (shrisakthi)
INSERT INTO public.user_roles (user_id, role)
VALUES ('fd218e53-6a38-47f9-920c-1214c28e7143', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;