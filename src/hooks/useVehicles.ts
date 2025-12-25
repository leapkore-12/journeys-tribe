import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Vehicle = Tables<'vehicles'>;
export type VehicleImage = Tables<'vehicle_images'>;

export interface VehicleWithImages extends Vehicle {
  vehicle_images: VehicleImage[];
}

export const useVehicles = (userId?: string) => {
  const { user } = useAuth();
  const targetId = userId || user?.id;

  return useQuery({
    queryKey: ['vehicles', targetId],
    queryFn: async () => {
      if (!targetId) return [];

      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          vehicle_images (*)
        `)
        .eq('user_id', targetId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching vehicles:', error);
        return [];
      }
      return data as VehicleWithImages[];
    },
    enabled: !!targetId,
  });
};

export const useVehicle = (vehicleId: string) => {
  return useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          vehicle_images (*)
        `)
        .eq('id', vehicleId)
        .single();

      if (error) {
        console.error('Error fetching vehicle:', error);
        return null;
      }
      return data as VehicleWithImages;
    },
    enabled: !!vehicleId,
  });
};

export const useCreateVehicle = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (vehicle: Omit<TablesInsert<'vehicles'>, 'user_id'>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('vehicles')
        .insert({ ...vehicle, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles', user?.id] });
    },
  });
};

export const useUpdateVehicle = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<'vehicles'> & { id: string }) => {
      const { data, error } = await supabase
        .from('vehicles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles', user?.id] });
    },
  });
};

export const useDeleteVehicle = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (vehicleId: string) => {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles', user?.id] });
    },
  });
};

export const useUploadVehicleImage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ vehicleId, file }: { vehicleId: string; file: File }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${vehicleId}/${Date.now()}.${fileExt}`;

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from('vehicle-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('vehicle-images')
        .getPublicUrl(fileName);

      // Insert image record
      const { error: insertError } = await supabase
        .from('vehicle_images')
        .insert({
          vehicle_id: vehicleId,
          image_url: publicUrl,
        });

      if (insertError) throw insertError;

      return publicUrl;
    },
    onSuccess: (_, { vehicleId }) => {
      queryClient.invalidateQueries({ queryKey: ['vehicle', vehicleId] });
      queryClient.invalidateQueries({ queryKey: ['vehicles', user?.id] });
    },
  });
};

export const useDeleteVehicleImage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ imageId, imageUrl }: { imageId: string; imageUrl: string }) => {
      // Extract path from URL and delete from storage
      const pathMatch = imageUrl.match(/vehicle-images\/(.+)$/);
      if (pathMatch) {
        const path = decodeURIComponent(pathMatch[1]);
        await supabase.storage.from('vehicle-images').remove([path]);
      }
      
      // Delete from database
      const { error } = await supabase
        .from('vehicle_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['vehicle'] });
    },
  });
};
