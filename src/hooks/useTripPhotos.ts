import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export const useUploadTripPhotos = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ tripId, photos }: { tripId: string; photos: File[] }) => {
      if (!user?.id) throw new Error('Not authenticated');
      if (photos.length === 0) return [];

      const uploadedPhotos: { image_url: string; display_order: number }[] = [];

      for (let i = 0; i < photos.length; i++) {
        const file = photos[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${tripId}/${Date.now()}-${i}.${fileExt}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('trip-photos')
          .upload(fileName, file, { cacheControl: '3600', upsert: false });

        if (uploadError) {
          console.error('Error uploading photo:', uploadError);
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('trip-photos')
          .getPublicUrl(fileName);

        uploadedPhotos.push({
          image_url: publicUrl,
          display_order: i + 1, // Start from 1 since map is 0
        });
      }

      // Insert records into trip_photos table
      if (uploadedPhotos.length > 0) {
        const { error: insertError } = await supabase
          .from('trip_photos')
          .insert(
            uploadedPhotos.map(photo => ({
              trip_id: tripId,
              image_url: photo.image_url,
              display_order: photo.display_order,
            }))
          );

        if (insertError) {
          console.error('Error inserting trip photos:', insertError);
          throw insertError;
        }
      }

      return uploadedPhotos;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-trips'] });
      queryClient.invalidateQueries({ queryKey: ['user-trips'] });
    },
  });
};
