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

const PostTrip = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { tripState, resetTrip } = useTrip();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('Everyone');
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const visibilityOptions = ['Everyone', 'Friends only', 'Only me'];

  const handleDelete = () => {
    resetTrip();
    toast({
      title: "Trip deleted",
      description: "Your trip has been deleted",
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
    
    resetTrip();
    setIsPosting(false);
    navigate('/feed');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background safe-top">
      <TripHeader backTo="/trip/paused" />
      
      <div className="flex-1 px-4 py-4 pb-24 space-y-4">
        {/* Title Input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
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
          transition={{ delay: 0.1 }}
        >
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="min-h-24 bg-transparent border-primary text-foreground placeholder:text-muted-foreground resize-none"
          />
        </motion.div>

        {/* Vehicle Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-secondary rounded-xl p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚗</span>
            <span className="text-foreground font-medium">
              {tripState.vehicle?.name || 'Audi Q7'}
            </span>
          </div>
          <button className="text-primary text-sm font-medium">Edit</button>
        </motion.div>

        {/* Convoy Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
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
          transition={{ delay: 0.4 }}
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
          transition={{ delay: 0.5 }}
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
            disabled={isPosting}
            className="flex-1 h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            {isPosting ? 'Posting...' : 'Post trip'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PostTrip;
