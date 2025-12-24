import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Image, ChevronDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import TripHeader from '@/components/trip/TripHeader';
import { useTrip } from '@/context/TripContext';
import { useToast } from '@/hooks/use-toast';
import { useCreateTrip } from '@/hooks/useTrips';
import { generateStaticMapUrl, generateSimpleMapUrl } from '@/lib/mapbox-static';

const PostTrip = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { tripState, resetTrip } = useTrip();
  const createTrip = useCreateTrip();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('Everyone');
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const visibilityOptions = ['Everyone', 'Friends only', 'Only me'];

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

  const handleDelete = () => {
    resetTrip();
    toast({
      title: "Trip deleted",
      description: "Your trip has been deleted",
    });
    navigate('/feed');
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

    setIsPosting(true);

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

      // Determine visibility
      const isPublic = visibility === 'Everyone';

      // Create the trip in the database
      await createTrip.mutateAsync({
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
        vehicle_id: tripState.vehicle?.id || null,
        status: 'completed',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      });

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
      setIsPosting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background safe-top">
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
              {tripState.convoy.length > 0 ? (
                tripState.convoy.slice(0, 4).map(member => (
                  <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback>{member.name[0]}</AvatarFallback>
                  </Avatar>
                ))
              ) : (
                <span className="text-muted-foreground text-sm">No convoy</span>
              )}
            </div>
          </div>
          <button className="text-primary text-sm font-medium">Edit</button>
        </motion.div>

        {/* Add Photos/Video */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <button className="w-full h-32 border-2 border-dashed border-primary rounded-xl flex flex-col items-center justify-center gap-2">
            <Image className="h-8 w-8 text-primary" />
            <span className="text-primary font-medium">Add photos/video</span>
          </button>
        </motion.div>

        {/* Visibility Dropdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="relative"
        >
          <button
            onClick={() => setShowVisibilityDropdown(!showVisibilityDropdown)}
            className="w-full h-12 px-4 bg-secondary rounded-lg flex items-center justify-between"
          >
            <span className="text-muted-foreground">Who can view this trip</span>
            <div className="flex items-center gap-2">
              <span className="text-foreground">{visibility}</span>
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${showVisibilityDropdown ? 'rotate-180' : ''}`} />
            </div>
          </button>
          
          {showVisibilityDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full left-0 right-0 mt-1 bg-secondary rounded-lg border border-border overflow-hidden z-50"
            >
              {visibilityOptions.map(option => (
                <button
                  key={option}
                  onClick={() => {
                    setVisibility(option);
                    setShowVisibilityDropdown(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors text-foreground"
                >
                  {option}
                </button>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Bottom Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background space-y-3">
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
            disabled={isPosting || createTrip.isPending}
            className="flex-1 h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            {isPosting || createTrip.isPending ? 'Posting...' : 'Post trip'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PostTrip;
