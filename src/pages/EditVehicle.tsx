import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockVehicles } from '@/lib/mock-data';
import { useCurrentProfile } from '@/hooks/useProfile';

const EditVehicle = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Find existing vehicle if editing
  const existingVehicle = id ? mockVehicles.find(v => v.id === id) : null;
  
  // Get user profile to check plan type
  const { data: profile } = useCurrentProfile();
  const isPaidUser = profile?.plan_type === 'paid';
  const maxPhotos = isPaidUser ? 100 : 5;
  
  const [vehicleType, setVehicleType] = useState<string>(existingVehicle?.type || '');
  const [makeModel, setMakeModel] = useState(
    existingVehicle ? `${existingVehicle.make} ${existingVehicle.model}` : ''
  );
  const [description, setDescription] = useState(existingVehicle?.specs || '');
  const [photos, setPhotos] = useState<string[]>(existingVehicle?.images || []);

  const handleFinish = () => {
    // TODO: Save vehicle data
    navigate('/garage');
  };

  return (
    <div className="flex flex-col min-h-screen bg-background safe-top">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center px-4 h-14">
          <button
            onClick={() => navigate(-1)}
            className="text-primary"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="flex-1 text-center text-lg font-semibold text-foreground">
            {id ? 'Edit vehicle' : 'Add vehicle'}
          </h1>
          <div className="w-6" /> {/* Spacer for centering */}
        </div>
      </header>

      <div className="flex-1 p-4 space-y-6">
        {/* Vehicle Type */}
        <div className="space-y-2">
          <Label className="text-base text-foreground">Car or motorbike:</Label>
          <Select value={vehicleType} onValueChange={setVehicleType}>
            <SelectTrigger className="w-full bg-card border-border">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="car">Car</SelectItem>
              <SelectItem value="motorbike">Motorbike</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Make and Model */}
        <div className="space-y-2">
          <Label className="text-base text-foreground">Make and model</Label>
          <Input
            value={makeModel}
            onChange={(e) => setMakeModel(e.target.value)}
            placeholder="e.g. Audi Q7"
            className="bg-card border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label className="text-base text-foreground">Description</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Year, engine specs, power output..."
            className="bg-card border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Photos Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base text-foreground">Photos</Label>
            <span className="text-sm text-muted-foreground">
              {isPaidUser ? `${photos.length} photos` : `${photos.length}/${maxPhotos}`}
            </span>
          </div>
          
          {/* Photo Upload Area */}
          <button 
            className="w-full aspect-[2/1] border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground transition-colors"
            disabled={!isPaidUser && photos.length >= maxPhotos}
          >
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
              <Plus className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium">Add photos</span>
            <span className="text-xs">
              {isPaidUser ? 'Unlimited photos per vehicle' : `Up to ${maxPhotos} photos per vehicle`}
            </span>
          </button>

          {/* Existing Photos Grid */}
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-4">
              {photos.slice(0, 6).map((photo, index) => (
                <div 
                  key={index} 
                  className="aspect-square rounded-lg overflow-hidden bg-secondary relative"
                >
                  <img 
                    src={photo} 
                    alt={`Vehicle photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {photos.length > 6 && (
                <div className="aspect-square rounded-lg bg-secondary flex items-center justify-center">
                  <div className="text-center">
                    <Image className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                    <span className="text-xs text-muted-foreground">+{photos.length - 6}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Finish Button */}
      <div className="p-4 pb-8">
        <Button 
          onClick={handleFinish}
          className="w-full h-12 bg-primary text-primary-foreground font-semibold text-base rounded-full"
        >
          Finished
        </Button>
      </div>
    </div>
  );
};

export default EditVehicle;
