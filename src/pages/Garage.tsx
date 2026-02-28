import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSmartBack } from '@/hooks/useSmartBack';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MoreHorizontal, Plus, Car, Star, ChevronUp, X } from 'lucide-react';
import { useVehicles } from '@/hooks/useVehicles';
import { useCurrentProfile } from '@/hooks/useProfile';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const Garage = () => {
  const navigate = useNavigate();
  const goBack = useSmartBack('/profile');
  const { data: vehicles, isLoading } = useVehicles();
  const { data: profile } = useCurrentProfile();
  const [expandedVehicleId, setExpandedVehicleId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const toggleExpand = (vehicleId: string) => {
    setExpandedVehicleId(prev => prev === vehicleId ? null : vehicleId);
  };

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
            {profile?.username ? `@${profile.username}'s` : 'My'} Garage
          </h1>
          <button 
            onClick={() => navigate('/garage/edit')}
            className="w-8 h-8 bg-primary rounded-md flex items-center justify-center"
          >
            <Plus className="h-5 w-5 text-primary-foreground" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-24">
        {isLoading ? (
          <div className="p-4 space-y-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
                <div className="grid grid-cols-3 gap-1">
                  {[...Array(6)].map((_, j) => (
                    <Skeleton key={j} className="aspect-square rounded-lg" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : vehicles && vehicles.length > 0 ? (
          vehicles.map((vehicle, index) => {
            const isExpanded = expandedVehicleId === vehicle.id;
            const hasMoreThan5 = vehicle.vehicle_images && vehicle.vehicle_images.length > 5;
            const displayPhotos = isExpanded 
              ? vehicle.vehicle_images 
              : vehicle.vehicle_images?.slice(0, 5) || [];

            return (
              <motion.div
                key={vehicle.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="py-6"
              >
                {/* Vehicle Header - Name + Edit */}
                <div className="flex items-center justify-between px-4 mb-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-foreground">{vehicle.name}</h2>
                    {vehicle.is_primary && (
                      <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                    )}
                  </div>
                  <button 
                    onClick={() => navigate(`/garage/edit/${vehicle.id}`)}
                    className="text-primary font-medium text-base"
                  >
                    Edit
                  </button>
                </div>

                {/* Specs Line */}
                <p className="text-sm text-muted-foreground px-4 mb-4 leading-relaxed">
                  {vehicle.make}
                  {vehicle.color && ` • ${vehicle.color}`}
                </p>

                {/* Image Grid */}
                <div className="px-4">
                  {vehicle.vehicle_images && vehicle.vehicle_images.length > 0 ? (
                    <>
                      <AnimatePresence mode="wait">
                        <motion.div 
                          key={isExpanded ? 'expanded' : 'collapsed'}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="grid grid-cols-3 gap-1"
                        >
                          {displayPhotos.map((img, i) => (
                            <button 
                              key={img.id} 
                              className="aspect-square rounded-lg overflow-hidden bg-secondary"
                              onClick={() => setSelectedImage(img.image_url)}
                            >
                              <img 
                                src={img.image_url} 
                                alt={`${vehicle.name} photo ${i + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                          
                          {/* View More/Less Button - only show if more than 5 photos */}
                          {hasMoreThan5 && (
                            <button 
                              className="aspect-square rounded-lg bg-primary flex flex-col items-center justify-center gap-1"
                              onClick={() => toggleExpand(vehicle.id)}
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="h-6 w-6 text-primary-foreground" />
                                  <span className="text-xs text-primary-foreground font-medium">View less</span>
                                </>
                              ) : (
                                <>
                                  <MoreHorizontal className="h-6 w-6 text-primary-foreground" />
                                  <span className="text-xs text-primary-foreground font-medium">View more</span>
                                </>
                              )}
                            </button>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </>
                  ) : (
                    <div className="col-span-3 aspect-video rounded-lg bg-secondary flex items-center justify-center">
                      <div className="text-center">
                        <Car className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No photos yet</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Separator between vehicles */}
                {vehicles && index < vehicles.length - 1 && (
                  <div className="border-b border-border mt-6 mx-4" />
                )}
              </motion.div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
              <Car className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground">No vehicles yet</h3>
            <p className="text-sm text-muted-foreground text-center mt-1">
              Add your first vehicle to start tracking your trips
            </p>
            <Button
              onClick={() => navigate('/garage/edit')}
              className="mt-4 bg-primary"
            >
              Add Vehicle
            </Button>
          </div>
        )}
      </div>

      {/* Fullscreen Image Viewer */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-none w-screen h-screen p-0 border-none bg-black/95 rounded-none [&>button]:z-50 [&>button]:text-white [&>button]:top-4 [&>button]:right-4">
          {selectedImage && (
            <div className="w-full h-full flex items-center justify-center p-4">
              <img
                src={selectedImage}
                alt="Vehicle photo"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Garage;