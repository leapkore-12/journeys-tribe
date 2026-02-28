import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSmartBack } from '@/hooks/useSmartBack';
import { ArrowLeft, Plus, X, Loader2, Star, Trash2 } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useCurrentProfile } from '@/hooks/useProfile';
import { 
  useVehicle, 
  useCreateVehicle, 
  useUpdateVehicle, 
  useUploadVehicleImage,
  useDeleteVehicleImage,
  useDeleteVehicle,
  useSetPrimaryImage,
  VehicleImage
} from '@/hooks/useVehicles';
import { pickMultiplePhotosAsFiles } from '@/lib/capacitor-utils';
import { useToast } from '@/hooks/use-toast';

const EditVehicle = () => {
  const navigate = useNavigate();
  const goBack = useSmartBack('/garage');
  const { id } = useParams();
  const { toast } = useToast();
  
  // Get existing vehicle if editing
  const [createdVehicleId, setCreatedVehicleId] = useState<string | null>(null);
  const activeVehicleId = id || createdVehicleId || '';
  const { data: existingVehicle, isLoading: isLoadingVehicle, refetch: refetchVehicle } = useVehicle(activeVehicleId);
  
  // Get user profile to check plan type
  const { data: profile } = useCurrentProfile();
  const isPaidUser = profile?.plan_type === 'paid';
  const maxPhotos = isPaidUser ? 100 : 5;
  
  // Mutations
  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();
  const uploadImage = useUploadVehicleImage();
  const deleteImage = useDeleteVehicleImage();
  const deleteVehicle = useDeleteVehicle();
  const setPrimaryImage = useSetPrimaryImage();
  
  // Form state
  const [vehicleType, setVehicleType] = useState<string>('');
  const [makeModel, setMakeModel] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Use photos from existingVehicle data for real-time updates
  const photos: VehicleImage[] = existingVehicle?.vehicle_images || [];

  // Populate form with existing vehicle data
  useEffect(() => {
    if (existingVehicle) {
      setVehicleType(existingVehicle.color || '');
      setMakeModel(existingVehicle.name || '');
      setDescription(existingVehicle.make || '');
    }
  }, [existingVehicle]);

  const handleAddPhoto = async () => {
    const currentPhotoCount = photos.length;
    
    if (!isPaidUser && currentPhotoCount >= maxPhotos) {
      toast({
        title: "Photo limit reached",
        description: `Free users can upload up to ${maxPhotos} photos per vehicle. Upgrade to Pro for unlimited photos.`,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      
      let vehicleId = id || createdVehicleId;

      if (!vehicleId) {
        if (!makeModel.trim()) {
          toast({
            title: "Enter make and model first",
            description: "Please enter the vehicle make and model before adding photos.",
            variant: "destructive",
          });
          setIsUploading(false);
          return;
        }
        
        const newVehicle = await createVehicle.mutateAsync({
          name: makeModel,
          make: description || null,
          model: null,
          color: vehicleType || null,
        });
        
        vehicleId = newVehicle.id;
        setCreatedVehicleId(vehicleId);
        toast({
          title: "Vehicle created",
          description: "Now uploading your photos...",
        });
      }

      // Pick multiple photos
      const files = await pickMultiplePhotosAsFiles();
      
      if (!files.length) {
        setIsUploading(false);
        return;
      }

      // Check limit for bulk upload
      const allowedCount = isPaidUser ? files.length : Math.min(files.length, maxPhotos - currentPhotoCount);
      
      if (allowedCount < files.length) {
        toast({
          title: "Some photos skipped",
          description: `Only ${allowedCount} photo(s) will be uploaded due to the free plan limit.`,
        });
      }

      // Upload all allowed photos
      for (let i = 0; i < allowedCount; i++) {
        await uploadImage.mutateAsync({ vehicleId, file: files[i] });
      }

      // Refetch to show new photos immediately
      await refetchVehicle();

      toast({
        title: `${allowedCount} photo(s) uploaded`,
        description: "Your photos have been added to this vehicle.",
      });
    } catch (error) {
      console.error('Photo upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload photos. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async (imageId: string, imageUrl: string) => {
    try {
      await deleteImage.mutateAsync({ imageId, imageUrl });
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

  const handleSetPrimaryPhoto = async (imageId: string) => {
    const vehicleId = id || createdVehicleId;
    if (!vehicleId) return;

    try {
      await setPrimaryImage.mutateAsync({ vehicleId, imageId });
      toast({
        title: "Primary photo set",
        description: "This photo will be used when posting trips.",
      });
    } catch (error) {
      console.error('Set primary photo error:', error);
      toast({
        title: "Failed to set primary",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteVehicle = async () => {
    if (!id) return;
    
    setIsDeleting(true);
    try {
      await deleteVehicle.mutateAsync(id);
      toast({
        title: "Vehicle deleted",
        description: "Your vehicle has been removed from your garage.",
      });
      navigate('/garage');
    } catch (error) {
      console.error('Delete vehicle error:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete vehicle. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFinish = async () => {
    const existingId = id || createdVehicleId;

    if (existingId) {
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

        await updateVehicle.mutateAsync({
          id: existingId,
          name: makeModel,
          make: description || null,
          model: null,
          color: vehicleType || null,
        });
        toast({
          title: "Vehicle saved",
          description: "Your vehicle has been saved successfully.",
        });
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
      return;
    }

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

      await createVehicle.mutateAsync({
        name: makeModel,
        make: description || null,
        model: null,
        color: vehicleType || null,
      });
      toast({
        title: "Vehicle added",
        description: "Your vehicle has been added to your garage.",
      });
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
      <div className="flex flex-col bg-background items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center px-4 h-14">
          <button
            onClick={goBack}
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

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32">
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
            disabled={isUploading || (!isPaidUser && photos.length >= maxPhotos)}
            className="w-full py-6 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                  <Plus className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium">Add photos</span>
                <span className="text-xs">
                  {isPaidUser ? 'Unlimited photos per vehicle' : `Up to ${maxPhotos} photos per vehicle`}
                </span>
              </>
            )}
          </button>

          {/* Photo Preview Grid with Primary Selection */}
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-4">
              {photos.map((photo) => (
                <div 
                  key={photo.id} 
                  className="aspect-square rounded-lg overflow-hidden bg-secondary relative group"
                >
                  <img 
                    src={photo.image_url} 
                    alt="Vehicle photo"
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Primary badge/button */}
                  <button
                    onClick={() => handleSetPrimaryPhoto(photo.id)}
                    className="absolute top-1 left-1 bg-black/60 rounded-full p-1.5 transition-opacity"
                    title={photo.is_primary ? "Primary photo" : "Set as primary"}
                  >
                    <Star 
                      className={`h-4 w-4 ${
                        photo.is_primary 
                          ? 'fill-yellow-500 text-yellow-500' 
                          : 'text-white/70 hover:text-white'
                      }`} 
                    />
                  </button>
                  
                  {/* Delete button */}
                  <button
                    onClick={() => handleDeletePhoto(photo.id, photo.image_url)}
                    className="absolute top-1 right-1 bg-black/60 rounded-full p-1.5"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Help text for primary photo */}
          {photos.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Tap the star to set a primary photo for trip posts
            </p>
          )}
        </div>

        {/* Delete Vehicle Button */}
        {id && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full flex items-center justify-center gap-2">
                <Trash2 className="h-4 w-4" />
                Delete Vehicle
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete vehicle?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. All photos associated with this vehicle will also be deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteVehicle}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Delete"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
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