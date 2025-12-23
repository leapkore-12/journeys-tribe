import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MoreHorizontal, Plus, Car } from 'lucide-react';
import { useVehicles } from '@/hooks/useVehicles';
import { useCurrentProfile } from '@/hooks/useProfile';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

const Garage = () => {
  const navigate = useNavigate();
  const { data: vehicles, isLoading } = useVehicles();
  const { data: profile } = useCurrentProfile();

  return (
    <div className="flex flex-col min-h-screen bg-background safe-top pb-24">
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

      <div className="flex-1">
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
          vehicles.map((vehicle, index) => (
            <motion.div
              key={vehicle.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="py-6"
            >
              {/* Vehicle Header - Name + Edit */}
              <div className="flex items-center justify-between px-4 mb-2">
                <h2 className="text-2xl font-bold text-foreground">{vehicle.name}</h2>
                <button 
                  onClick={() => navigate(`/garage/edit/${vehicle.id}`)}
                  className="text-primary font-medium text-base"
                >
                  Edit
                </button>
              </div>

              {/* Specs Line */}
              <p className="text-sm text-muted-foreground px-4 mb-4 leading-relaxed">
                {vehicle.year} {vehicle.make} {vehicle.model}
                {vehicle.color && ` • ${vehicle.color}`}
              </p>

              {/* Image Grid - 3 columns x 2 rows */}
              <div className="grid grid-cols-3 gap-1 px-4">
                {vehicle.vehicle_images && vehicle.vehicle_images.length > 0 ? (
                  <>
                    {vehicle.vehicle_images.slice(0, 5).map((img, i) => (
                      <div 
                        key={img.id} 
                        className="aspect-square rounded-lg overflow-hidden bg-secondary"
                      >
                        <img 
                          src={img.image_url} 
                          alt={`${vehicle.name} photo ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    
                    {/* View More Button - 6th slot */}
                    <button 
                      className="aspect-square rounded-lg bg-primary flex flex-col items-center justify-center gap-1"
                      onClick={() => {/* TODO: Open full gallery */}}
                    >
                      <MoreHorizontal className="h-6 w-6 text-primary-foreground" />
                      <span className="text-xs text-primary-foreground font-medium">View more</span>
                    </button>
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
          ))
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
    </div>
  );
};

export default Garage;
