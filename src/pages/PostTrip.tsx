import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Image, ChevronDown, Trash2, X, Lock, Crown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import TripHeader from '@/components/trip/TripHeader';
import { useTrip } from '@/context/TripContext';
import { useToast } from '@/hooks/use-toast';
import { useUploadTripPhotos } from '@/hooks/useTripPhotos';
import { generateStaticMapUrl, generateSimpleMapUrl } from '@/lib/mapbox-static';
import { useFeatureAccess } from '@/hooks/useSubscription';
import { useCurrentProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useFinalizeTrip } from '@/hooks/useFinalizeTrip';
import { useConvoyMembers } from '@/hooks/useConvoyMembers';
import FixedBottomActions from '@/components/layout/FixedBottomActions';

const MAX_PHOTOS = 5;

const PostTrip = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { tripState, resetTrip, addTripPhoto, removeTripPhoto } = useTrip();
  const uploadPhotos = useUploadTripPhotos();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { canUsePerTripVisibility } = useFeatureAccess();
  const { data: profile } = useCurrentProfile();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { cancelTrip, resolveTripId } = useFinalizeTrip();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'tribe' | 'private'>('public');
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false);
  const [isPosting, setIsPosting] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [resolvedTripIdState, setResolvedTripIdState] = useState<string | null>(null);

  // Resolve trip ID on mount to fetch convoy members
  useEffect(() => {
    const fetchTripId = async () => {
      const id = await resolveTripId();
      setResolvedTripIdState(id);
    };
    fetchTripId();
  }, [resolveTripId]);

  // Fetch convoy members from database (include completed since trip might be ending)
  const { data: convoyMembers = [] } = useConvoyMembers(resolvedTripIdState ?? undefined, { includeCompleted: true });
  
  // Filter out the current user (leader) from display
  const displayConvoyMembers = convoyMembers.filter(m => m.user_id !== user?.id);

  // Visibility options - paid users get all, free users get default based on profile
  const paidVisibilityOptions = [
    { value: 'public', label: 'Everyone', icon: '🌐' },
    { value: 'followers', label: 'Followers only', icon: '👥' },
    { value: 'tribe', label: 'Your Tribe', icon: '⭐' },
    { value: 'private', label: 'Only me', icon: '🔒' },
  ] as const;

  const freeVisibilityLabel = profile?.is_private ? 'Followers only' : 'Everyone';

  // Generate map preview URL from route coordinates
  const mapPreviewUrl = tripState.routeCoordinates && tripState.routeCoordinates.length >= 2
    ? generateStaticMapUrl(tripState.routeCoordinates, { width: 600, height: 300 })
    : tripState.startCoordinates && tripState.destinationCoordinates
      ? generateSimpleMapUrl(
          tripState.startCoordinates,
          tripState.destinationCoordinates,
          { width: 600, height: 300 }
        )
      : null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const currentPhotos = tripState.tripPhotos || [];
    const remainingSlots = MAX_PHOTOS - currentPhotos.length;
    const newFiles = Array.from(files).slice(0, remainingSlots);
    
    // Filter only images
    const imageFiles = newFiles.filter(file => file.type.startsWith('image/'));
    
    imageFiles.forEach(file => addTripPhoto(file));
    
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddPhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    console.log('[PostTrip] Deleting trip...');
    
    // Use the reliable cancel function which looks up trip ID from backend if needed
    const success = await cancelTrip();
    
    if (success) {
      console.log('[PostTrip] Trip cancelled successfully');
      toast({
        title: "Trip deleted",
        description: "Your trip has been deleted",
      });
      navigate('/feed');
    } else {
      console.error('[PostTrip] Failed to cancel trip');
      setIsDeleting(false);
    }
  };

  const handlePost = async () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your trip",
        variant: "destructive",
      });
      return;
    }

    setIsPosting('Creating trip...');

    try {
      // Generate the static map URL for the trip
      let mapImageUrl: string | null = null;
      
      if (tripState.routeCoordinates && tripState.routeCoordinates.length >= 2) {
        mapImageUrl = generateStaticMapUrl(tripState.routeCoordinates, {
          width: 800,
          height: 500,
          strokeColor: '00C853',
          strokeWidth: 5,
        });
      } else if (tripState.startCoordinates && tripState.destinationCoordinates) {
        mapImageUrl = generateSimpleMapUrl(
          tripState.startCoordinates,
          tripState.destinationCoordinates,
          { width: 800, height: 500 }
        );
      }

      // Determine visibility for DB
      const tripVisibility = canUsePerTripVisibility 
        ? visibility 
        : (profile?.is_private ? 'followers' : 'public');
      
      const isPublic = tripVisibility === 'public';

      let tripId: string | null = null;
      
      // Resolve trip ID reliably - from context or backend
      const resolvedTripId = await resolveTripId();
      console.log('[PostTrip] Resolved trip ID:', resolvedTripId);

      // If we have an active trip ID, update it instead of creating a new one
      if (resolvedTripId) {
        const { error: updateError } = await supabase
          .from('trips')
          .update({
            title: title.trim(),
            description: description.trim() || null,
            map_image_url: mapImageUrl,
            is_public: isPublic,
            visibility: tripVisibility,
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', resolvedTripId);
        
        if (updateError) {
          console.error('[PostTrip] Failed to update trip:', updateError);
          throw new Error('Failed to update trip');
        }
        
        tripId = resolvedTripId;
        console.log('[PostTrip] Trip updated successfully:', tripId);
        
        // Update convoy members status to 'completed'
        await supabase
          .from('convoy_members')
          .update({ status: 'completed' })
          .eq('trip_id', tripId)
          .eq('status', 'active');
        
        // Delete any active_trips entries
        await supabase
          .from('active_trips')
          .delete()
          .eq('trip_id', tripId);
      } else {
        // Fallback: Create a new trip if no active trip ID exists
        const { data: createdTrip, error: createError } = await supabase
          .from('trips')
          .insert({
            user_id: user!.id,
            title: title.trim(),
            description: description.trim() || null,
            start_location: tripState.startLocation || null,
            end_location: tripState.destinationAddress || tripState.destination || null,
            start_lat: tripState.startCoordinates?.[1] || null,
            start_lng: tripState.startCoordinates?.[0] || null,
            end_lat: tripState.destinationCoordinates?.[1] || null,
            end_lng: tripState.destinationCoordinates?.[0] || null,
            distance_km: tripState.routeDistance 
              ? Math.round(tripState.routeDistance * 10) / 10 
              : null,
            duration_minutes: tripState.routeDuration 
              ? Math.round(tripState.routeDuration) 
              : null,
            map_image_url: mapImageUrl,
            is_public: isPublic,
            visibility: tripVisibility,
            vehicle_id: tripState.vehicle?.id || null,
            status: 'completed',
            started_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError || !createdTrip) {
          console.error('Failed to create trip:', createError);
          throw new Error('Failed to create trip');
        }
        
        tripId = createdTrip.id;
      }

      // Upload trip photos if any
      const photos = tripState.tripPhotos || [];
      if (photos.length > 0) {
        setIsPosting('Uploading photos...');
        await uploadPhotos.mutateAsync({
          tripId: tripId,
          photos: photos,
        });
      }

      // Invalidate active-convoy query to hide the Active Trip bar
      queryClient.invalidateQueries({ queryKey: ['active-convoy'] });

      toast({
        title: "Trip Posted! 🏁",
        description: "Your trip is now visible to your followers",
      });

      resetTrip();
      navigate('/feed');
    } catch (error) {
      console.error('Error posting trip:', error);
      toast({
        title: "Failed to post trip",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsPosting('');
    }
  };

  return (
    <div className="flex flex-col bg-background">
      <TripHeader backTo="/trip/paused" />
      
      <div className="flex-1 px-4 py-4 pb-24 space-y-4 overflow-y-auto">
        {/* Map Preview */}
        {mapPreviewUrl && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl overflow-hidden border border-border"
          >
            <img 
              src={mapPreviewUrl} 
              alt="Trip route preview" 
              className="w-full h-40 object-cover"
            />
          </motion.div>
        )}

        {/* Title Input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Trip title"
            className="h-12 bg-transparent border-primary text-foreground placeholder:text-muted-foreground"
          />
        </motion.div>

        {/* Description Input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="min-h-24 bg-transparent border-primary text-foreground placeholder:text-muted-foreground resize-none"
          />
        </motion.div>

        {/* Route Info */}
        {(tripState.startLocation || tripState.destinationAddress) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-secondary rounded-xl p-4 space-y-2"
          >
            {tripState.startLocation && tripState.startLocation !== 'Your location' && (
              <div className="flex items-center gap-2">
                <span className="text-primary">📍</span>
                <span className="text-sm text-muted-foreground">From:</span>
                <span className="text-sm text-foreground truncate">{tripState.startLocation}</span>
              </div>
            )}
            {tripState.destinationAddress && (
              <div className="flex items-center gap-2">
                <span className="text-primary">🏁</span>
                <span className="text-sm text-muted-foreground">To:</span>
                <span className="text-sm text-foreground truncate">{tripState.destinationAddress}</span>
              </div>
            )}
            {tripState.routeDistance && tripState.routeDuration && (
              <div className="flex items-center gap-4 pt-2 border-t border-border">
                <span className="text-sm text-muted-foreground">
                  {tripState.routeDistance.toFixed(1)} km
                </span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(tripState.routeDuration)} min
                </span>
              </div>
            )}
          </motion.div>
        )}

        {/* Vehicle Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-secondary rounded-xl p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚗</span>
            <span className="text-foreground font-medium">
              {tripState.vehicle?.name || 'No vehicle selected'}
            </span>
          </div>
          <button className="text-primary text-sm font-medium">Edit</button>
        </motion.div>

        {/* Convoy Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="border border-primary rounded-xl p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="text-foreground font-medium">Convoy with</span>
            <div className="flex -space-x-2">
              {displayConvoyMembers.length > 0 ? (
                displayConvoyMembers.slice(0, 4).map(member => (
                  <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                    <AvatarImage src={member.profile?.avatar_url || undefined} alt={member.profile?.display_name || 'Member'} />
                    <AvatarFallback>{member.profile?.display_name?.[0] || 'M'}</AvatarFallback>
                  </Avatar>
                ))
              ) : (
                <span className="text-muted-foreground text-sm">No convoy</span>
              )}
              {displayConvoyMembers.length > 4 && (
                <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs text-muted-foreground">
                  +{displayConvoyMembers.length - 4}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Add Photos */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3"
        >
          {/* Photo previews */}
          {(tripState.tripPhotos || []).length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {(tripState.tripPhotos || []).map((photo, index) => (
                <div key={index} className="relative flex-shrink-0">
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={`Photo ${index + 1}`}
                    className="w-20 h-20 object-cover rounded-lg border border-border"
                  />
                  <button
                    onClick={() => removeTripPhoto(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-destructive rounded-full flex items-center justify-center"
                  >
                    <X className="h-4 w-4 text-destructive-foreground" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add photos button */}
          {(tripState.tripPhotos || []).length < MAX_PHOTOS ? (
            <button
              onClick={handleAddPhotoClick}
              className="w-full h-32 border-2 border-dashed border-primary rounded-xl flex flex-col items-center justify-center gap-2"
            >
              <Image className="h-8 w-8 text-primary" />
              <span className="text-primary font-medium">
                {(tripState.tripPhotos || []).length === 0 
                  ? 'Add photos' 
                  : `Add more (${(tripState.tripPhotos || []).length}/${MAX_PHOTOS})`}
              </span>
            </button>
          ) : (
            <div className="w-full py-3 text-center text-muted-foreground text-sm">
              Maximum {MAX_PHOTOS} photos reached
            </div>
          )}
        </motion.div>

        {/* Visibility Dropdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="relative"
        >
          {canUsePerTripVisibility ? (
            <>
              <button
                onClick={() => setShowVisibilityDropdown(!showVisibilityDropdown)}
                className="w-full h-12 px-4 bg-secondary rounded-lg flex items-center justify-between"
              >
                <span className="text-muted-foreground">Who can view this trip</span>
                <div className="flex items-center gap-2">
                  <span className="text-foreground">
                    {paidVisibilityOptions.find(o => o.value === visibility)?.icon}{' '}
                    {paidVisibilityOptions.find(o => o.value === visibility)?.label}
                  </span>
                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${showVisibilityDropdown ? 'rotate-180' : ''}`} />
                </div>
              </button>
              
              {showVisibilityDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-secondary rounded-lg border border-border overflow-hidden z-50"
                >
                  {paidVisibilityOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setVisibility(option.value);
                        setShowVisibilityDropdown(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors text-foreground flex items-center gap-2 ${visibility === option.value ? 'bg-muted/30' : ''}`}
                    >
                      <span>{option.icon}</span>
                      <span>{option.label}</span>
                      {option.value === 'tribe' && (
                        <span className="ml-auto text-xs text-primary">⭐</span>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </>
          ) : (
            <div className="w-full h-12 px-4 bg-secondary rounded-lg flex items-center justify-between">
              <span className="text-muted-foreground">Who can view this trip</span>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{freeVisibilityLabel}</span>
                <Crown className="h-4 w-4 text-yellow-500" />
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Bottom Buttons */}
      <FixedBottomActions>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleDelete}
            className="flex-1 h-14 border-foreground bg-transparent text-primary font-semibold"
          >
            <Trash2 className="h-5 w-5 mr-2" />
            Delete trip
          </Button>
          <Button
            onClick={handlePost}
            disabled={!!isPosting}
            className="flex-1 h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            {isPosting ? isPosting : 'Post trip'}
          </Button>
        </div>
      </FixedBottomActions>
    </div>
  );
};

export default PostTrip;
