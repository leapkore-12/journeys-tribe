import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useTripById, useUpdateTrip } from '@/hooks/useTrips';
import { useToast } from '@/hooks/use-toast';
import logoWhite from '@/assets/logo-white.svg';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import FixedBottomActions from '@/components/layout/FixedBottomActions';

const formatDistance = (km: number | null) => {
  if (!km) return '0 km';
  if (km >= 1000) return `${(km / 1000).toFixed(1)}k km`;
  return `${Math.round(km)} km`;
};

const formatDuration = (minutes: number | null) => {
  if (!minutes) return '0 min';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  return `${hours}h ${mins}m`;
};

const EditTrip = () => {
  const navigate = useNavigate();
  const handleBack = () => navigate('/feed');
  const { tripId } = useParams();
  const { toast } = useToast();
  const { data: trip, isLoading } = useTripById(tripId);
  const updateTrip = useUpdateTrip();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('public');

  useEffect(() => {
    if (trip) {
      setTitle(trip.title);
      setDescription(trip.description || '');
      setVisibility(trip.visibility);
    }
  }, [trip]);

  const handleSave = async () => {
    if (!tripId || !title.trim()) return;

    try {
      await updateTrip.mutateAsync({
        tripId,
        updates: {
          title: title.trim(),
          description: description.trim() || null,
          visibility,
        },
      });
      toast({ title: "Trip updated", description: "Your changes have been saved" });
      navigate(`/trip/${tripId}`);
    } catch (error) {
      toast({ title: "Failed to update", description: "Please try again", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col bg-background">
        <header className="sticky top-0 z-40 bg-background border-b border-border">
          <div className="flex items-center justify-between px-4 h-14">
            <button onClick={handleBack} className="text-foreground p-2 -ml-2">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <img src={logoWhite} alt="RoadTribe" className="h-6" />
            <div className="w-10" />
          </div>
        </header>
        <div className="p-4 space-y-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex flex-col bg-background">
        <header className="sticky top-0 z-40 bg-background border-b border-border">
          <div className="flex items-center justify-between px-4 h-14">
            <button onClick={handleBack} className="text-foreground p-2 -ml-2">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <img src={logoWhite} alt="RoadTribe" className="h-6" />
            <div className="w-10" />
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Trip not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={handleBack} className="text-foreground p-2 -ml-2">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="font-semibold text-foreground">Edit Trip</h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
        {/* Map Preview */}
        {trip.map_image_url && (
          <div className="relative h-48 rounded-xl overflow-hidden bg-secondary">
            <img 
              src={trip.map_image_url} 
              alt="Route map" 
              className="w-full h-full object-cover" 
            />
            <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded text-xs text-foreground">
              🗺️ Route
            </div>
          </div>
        )}

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Trip Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter trip title"
            className="bg-secondary border-border"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description..."
            className="bg-secondary border-border min-h-[100px]"
          />
        </div>

        {/* Route Info Card */}
        <div className="bg-card rounded-xl p-4 space-y-3 border border-border">
          <h3 className="font-semibold text-foreground text-sm">Route Details</h3>
          
          <div className="flex items-center gap-3 text-sm">
            <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
            <div>
              <p className="text-muted-foreground text-xs">Start</p>
              <p className="text-foreground">{trip.start_location || 'Unknown'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-sm">
            <Navigation className="h-4 w-4 text-primary flex-shrink-0" />
            <div>
              <p className="text-muted-foreground text-xs">Destination</p>
              <p className="text-foreground">{trip.end_location || 'Unknown'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6 pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground font-medium">{formatDistance(trip.distance_km)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground font-medium">{formatDuration(trip.duration_minutes)}</span>
            </div>
          </div>
        </div>

        {/* Visibility */}
        <div className="space-y-2">
          <Label htmlFor="visibility">Visibility</Label>
          <Select value={visibility} onValueChange={setVisibility}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Select visibility" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="followers">Followers Only</SelectItem>
              <SelectItem value="tribe">Tribe Only</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {visibility === 'public' && 'Anyone can see this trip'}
            {visibility === 'followers' && 'Only your followers can see this trip'}
            {visibility === 'tribe' && 'Only your tribe members can see this trip'}
            {visibility === 'private' && 'Only you can see this trip'}
          </p>
        </div>
      </div>

      {/* Save Button */}
      <FixedBottomActions showBorder>
        <Button
          onClick={handleSave}
          disabled={!title.trim() || updateTrip.isPending}
          className="w-full h-12"
        >
          {updateTrip.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </FixedBottomActions>
    </div>
  );
};

export default EditTrip;
