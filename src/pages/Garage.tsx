import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Car, ChevronRight, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockVehicles, Vehicle } from '@/lib/mock-data';

const Garage = () => {
  const navigate = useNavigate();
  const [vehicles] = useState<Vehicle[]>(mockVehicles);

  return (
    <div className="min-h-screen bg-background safe-top pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="text-foreground"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold text-foreground">My Garage</h1>
          </div>
          <Button size="sm" className="bg-primary">
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {vehicles.map((vehicle, index) => (
          <motion.div
            key={vehicle.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card rounded-xl overflow-hidden border border-border"
          >
            {/* Vehicle Image */}
            <div className="aspect-video bg-secondary relative">
              {vehicle.images[0] ? (
                <img 
                  src={vehicle.images[0]} 
                  alt={vehicle.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Car className="h-12 w-12" />
                </div>
              )}
              {/* Image count badge */}
              <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur rounded-full px-2 py-1 flex items-center gap-1">
                <Image className="h-3 w-3 text-foreground" />
                <span className="text-xs font-medium text-foreground">{vehicle.images.length}</span>
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-lg text-foreground">{vehicle.name}</h3>
                  <p className="text-muted-foreground">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground mt-1" />
              </div>
              <p className="text-sm text-primary mt-2 font-medium">
                {vehicle.specs}
              </p>
            </div>
          </motion.div>
        ))}

        {/* Add Vehicle Card */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: vehicles.length * 0.1 }}
          className="w-full bg-card border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-3">
            <Plus className="h-8 w-8" />
          </div>
          <p className="font-medium">Add New Vehicle</p>
          <p className="text-sm">Up to 10 photos per vehicle</p>
        </motion.button>
      </div>
    </div>
  );
};

export default Garage;
