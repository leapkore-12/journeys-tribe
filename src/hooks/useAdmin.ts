import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

// Check if current user is admin
export const useIsAdmin = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['isAdmin', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      
      if (error) {
        console.error('Error checking admin role:', error);
        return false;
      }
      
      return !!data;
    },
    enabled: !!user?.id,
  });
};

// Fetch all users for admin dashboard
export const useAllUsers = () => {
  return useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch roles for all users
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
      }
      
      // Map roles to users
      const rolesMap = new Map<string, string[]>();
      roles?.forEach(r => {
        const existing = rolesMap.get(r.user_id) || [];
        rolesMap.set(r.user_id, [...existing, r.role]);
      });
      
      return profiles.map(profile => ({
        ...profile,
        roles: rolesMap.get(profile.id) || [],
      }));
    },
  });
};

// Fetch single user for edit
export const useAdminUser = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['adminUser', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      // Fetch roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      return {
        ...profile,
        roles: roles?.map(r => r.role) || [],
      };
    },
    enabled: !!userId,
  });
};

// Update user plan type
export const useUpdateUserPlan = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, planType }: { userId: string; planType: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ plan_type: planType })
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminUser'] });
      toast.success('Plan updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update plan: ' + error.message);
    },
  });
};

// Update user profile
export const useAdminUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      updates 
    }: { 
      userId: string; 
      updates: { 
        username?: string; 
        display_name?: string; 
        plan_type?: string;
        monthly_trip_count?: number;
      } 
    }) => {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminUser'] });
      toast.success('Profile updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update profile: ' + error.message);
    },
  });
};

// Toggle admin role
export const useToggleAdminRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => {
      if (isAdmin) {
        // Add admin role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' });
        
        if (error) throw error;
      } else {
        // Remove admin role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminUser'] });
      toast.success('Admin role updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update role: ' + error.message);
    },
  });
};

// Create new user via edge function
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      email,
      password,
      username,
      display_name,
      plan_type,
    }: {
      email: string;
      password: string;
      username: string;
      display_name?: string;
      plan_type?: string;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('admin-create-user', {
        body: { email, password, username, display_name, plan_type },
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success('User created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create user: ' + error.message);
    },
  });
};

// Delete user via edge function
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await supabase.functions.invoke('admin-delete-user', {
        body: { userId },
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success('User deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete user: ' + error.message);
    },
  });
};

// Get admin stats
export const useAdminStats = () => {
  return useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      // Get admin user IDs first
      const { data: adminRoles, error: adminError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');
      
      if (adminError) throw adminError;
      
      const adminUserIds = new Set(adminRoles?.map(r => r.user_id) || []);
      
      // Get user counts
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, plan_type');
      
      if (profilesError) throw profilesError;
      
      // Filter out admin users from regular user counts
      const regularUsers = profiles?.filter(p => !adminUserIds.has(p.id)) || [];
      const totalUsers = regularUsers.length;
      const paidUsers = regularUsers.filter(p => p.plan_type === 'paid').length;
      const freeUsers = totalUsers - paidUsers;
      
      // Get trip count
      const { count: tripsCount, error: tripsError } = await supabase
        .from('trips')
        .select('*', { count: 'exact', head: true });
      
      if (tripsError) throw tripsError;
      
      return {
        totalUsers,
        paidUsers,
        freeUsers,
        totalTrips: tripsCount || 0,
        totalAdmins: adminRoles?.length || 0,
      };
    },
  });
};
