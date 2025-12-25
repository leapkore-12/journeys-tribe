import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Image, X, Loader2 } from 'lucide-react';
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
import { useCurrentProfile } from '@/hooks/useProfile';
import { 
  useVehicle, 
  useCreateVehicle, 
  useUpdateVehicle, 
  useUploadVehicleImage,
  useDeleteVehicleImage,
  VehicleImage
} from '@/hooks/useVehicles';
import { pickPhotoAsFile } from '@/lib/capacitor-utils';
import { useToast } from '@/hooks/use-toast';

const EditVehicle = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  
  // Get existing vehicle if editing
  const { data: existingVehicle, isLoading: isLoadingVehicle } = useVehicle(id || '');
  
  // Get user profile to check plan type
  const { data: profile } = useCurrentProfile();
  const isPaidUser = profile?.plan_type === 'paid';
  const maxPhotos = isPaidUser ? 100 : 5;
  
  // Mutations
  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();
  const uploadImage = useUploadVehicleImage();
  const deleteImage = useDeleteVehicleImage();
  
  // Form state
  const [vehicleType, setVehicleType] = useState<string>('');
  const [makeModel, setMakeModel] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<VehicleImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Populate form with existing vehicle data
  useEffect(() => {
    if (existingVehicle) {
      setVehicleType(existingVehicle.color || ''); // Using color field for type temporarily
      setMakeModel(`${existingVehicle.make || ''} ${existingVehicle.model || ''}`.trim());
      setDescription(existingVehicle.name || '');
      setPhotos(existingVehicle.vehicle_images || []);
    }
  }, [existingVehicle]);

  const handleAddPhoto = async () => {
    // Check photo limit for free users
    if (!isPaidUser && photos.length >= maxPhotos) {
      toast({
        title: "Photo limit reached",
        description: `Free users can upload up to ${maxPhotos} photos per vehicle. Upgrade to Pro for unlimited photos.`,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      const file = await pickPhotoAsFile();
      
      if (!file) {
        setIsUploading(false);
        return;
      }

      // If editing existing vehicle, upload directly
      if (id && existingVehicle) {
        await uploadImage.mutateAsync({ vehicleId: id, file });
        toast({
          title: "Photo uploaded",
          description: "Your photo has been added to this vehicle.",
        });
      } else {
        // For new vehicle, we need to create it first
        toast({
          title: "Save vehicle first",
          description: "Please save your vehicle before adding photos.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async (imageId: string, imageUrl: string) => {
    try {
      await deleteImage.mutateAsync({ imageId, imageUrl });
      setPhotos(prev => prev.filter(p => p.id !== imageId));
      toast({
        title: "Photo deleted",
        description: "The photo has been removed.",
      });
    } catch (error) {
      console.error('Delete photo error:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete photo. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFinish = async () => {
    if (!makeModel.trim()) {
      toast({
        title: "Make and model required",
        description: "Please enter the make and model of your vehicle.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      const [make, ...modelParts] = makeModel.trim().split(' ');
      const model = modelParts.join(' ');

      if (id && existingVehicle) {
        // Update existing vehicle
        await updateVehicle.mutateAsync({
          id,
          name: description || makeModel,
          make: make || null,
          model: model || null,
          color: vehicleType || null,
        });
        toast({
          title: "Vehicle updated",
          description: "Your vehicle has been updated successfully.",
        });
      } else {
        // Create new vehicle
        await createVehicle.mutateAsync({
          name: description || makeModel,
          make: make || null,
          model: model || null,
          color: vehicleType || null,
        });
        toast({
          title: "Vehicle added",
          description: "Your vehicle has been added to your garage.",
        });
      }
      navigate('/garage');
    } catch (error) {
      console.error('Save vehicle error:', error);
      toast({
        title: "Save failed",
        description: "Failed to save vehicle. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (id && isLoadingVehicle) {
    return (
      <div className="flex flex-col min-h-screen bg-background safe-top items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
          <div className="w-6" />
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
            onClick={handleAddPhoto}
            disabled={isUploading || (!isPaidUser && photos.length >= maxPhotos) || (!id && !existingVehicle)}
            className="w-full aspect-[2/1] border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                  <Plus className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium">
                  {!id ? 'Save vehicle first to add photos' : 'Add photos'}
                </span>
                <span className="text-xs">
                  {isPaidUser ? 'Unlimited photos per vehicle' : `Up to ${maxPhotos} photos per vehicle`}
                </span>
              </>
            )}
          </button>

          {/* Existing Photos Grid */}
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-4">
              {photos.slice(0, 6).map((photo) => (
                <div 
                  key={photo.id} 
                  className="aspect-square rounded-lg overflow-hidden bg-secondary relative group"
                >
                  <img 
                    src={photo.image_url} 
                    alt="Vehicle photo"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => handleDeletePhoto(photo.id, photo.image_url)}
                    className="absolute top-1 right-1 bg-black/60 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
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
          disabled={isSaving}
          className="w-full h-12 bg-primary text-primary-foreground font-semibold text-base rounded-full"
        >
          {isSaving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            'Finished'
          )}
        </Button>
      </div>
    </div>
  );
};

export default EditVehicle;
