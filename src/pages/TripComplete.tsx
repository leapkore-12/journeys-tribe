import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MapPin, Navigation, Clock, Car, Users, Image, 
  Save, Share2, CheckCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { formatDistance, formatDuration, mockVehicles, mockUsers } from '@/lib/mock-data';
import { useDeviceSpacing } from '@/hooks/useDeviceInfo';

const TripComplete = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { safeAreaTop } = useDeviceSpacing();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // Mock trip data
  const tripData = {
    startLocation: 'Los Angeles, CA',
    endLocation: 'San Francisco, CA',
    distance: 382,
    duration: 420,
    vehicle: mockVehicles[0],
    convoyMembers: mockUsers.filter(u => u.id !== 'current').slice(0, 2),
  };

  const handleSaveDraft = () => {
    toast({
      title: "Draft Saved",
      description: "Your trip has been saved as a draft",
    });
    navigate('/feed');
  };

  const handlePost = async () => {
    setIsPosting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "Trip Posted! 🏁",
      description: "Your trip is now visible to your followers",
    });
    
    setIsPosting(false);
    navigate('/feed');
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Success Header */}
      <div 
        className="bg-primary/10 border-b border-primary/20"
        style={{ 
          paddingTop: `max(env(safe-area-inset-top, ${safeAreaTop}px), ${safeAreaTop}px)` 
        }}
      >
        <div className="py-8 px-4 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle className="h-8 w-8 text-primary-foreground" />
          </motion.div>
          <h1 className="text-2xl font-bold text-foreground">Trip Complete!</h1>
          <p className="text-muted-foreground mt-1">Great drive! Ready to share?</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 safe-bottom">
        {/* Trip Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-4 border border-border"
        >
          <h2 className="font-semibold text-foreground mb-4">Trip Summary</h2>
          
          {/* Route */}
          <div className="flex items-start gap-3 mb-4">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <div className="w-0.5 h-8 bg-border" />
              <div className="w-3 h-3 rounded-full bg-primary" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Start</p>
                <p className="font-medium text-foreground">{tripData.startLocation}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">End</p>
                <p className="font-medium text-foreground">{tripData.endLocation}</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Distance</p>
                <p className="font-semibold text-foreground">{formatDistance(tripData.distance)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="font-semibold text-foreground">{formatDuration(tripData.duration)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Vehicle</p>
                <p className="font-semibold text-foreground text-sm">
                  {tripData.vehicle.make} {tripData.vehicle.model}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Convoy</p>
                <p className="font-semibold text-foreground">
                  {tripData.convoyMembers.length} members
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Map Preview Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="aspect-video bg-secondary rounded-xl flex items-center justify-center"
        >
          <div className="text-center text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Route Preview</p>
          </div>
        </motion.div>

        {/* Post Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              Trip Title
            </label>
            <Input
              placeholder="Give your trip a name..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-card"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              Description
            </label>
            <Textarea
              placeholder="How was your trip? Any highlights?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-card min-h-24 resize-none"
            />
          </div>

          <Button variant="outline" className="w-full">
            <Image className="h-4 w-4 mr-2" />
            Add Photos
          </Button>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3 pt-4"
        >
          <Button
            onClick={handlePost}
            disabled={isPosting}
            className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            {isPosting ? (
              'Posting...'
            ) : (
              <>
                <Share2 className="h-5 w-5 mr-2" />
                Post to Feed
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            className="w-full h-12"
          >
            <Save className="h-4 w-4 mr-2" />
            Save as Draft
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default TripComplete;
