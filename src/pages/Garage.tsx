import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MoreHorizontal, Plus } from 'lucide-react';
import { mockVehicles, Vehicle, getCurrentUser } from '@/lib/mock-data';

const Garage = () => {
  const navigate = useNavigate();
  const [vehicles] = useState<Vehicle[]>(mockVehicles);
  const user = getCurrentUser();

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
            {user.username}' Garage
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
        {vehicles.map((vehicle, index) => (
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
              {vehicle.year} {vehicle.specs}
            </p>

            {/* Image Grid - 3 columns x 2 rows */}
            <div className="grid grid-cols-3 gap-1 px-4">
              {vehicle.images.slice(0, 5).map((img, i) => (
                <div 
                  key={i} 
                  className="aspect-square rounded-lg overflow-hidden bg-secondary"
                >
                  <img 
                    src={img} 
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
            </div>

            {/* Separator between vehicles */}
            {index < vehicles.length - 1 && (
              <div className="border-b border-border mt-6 mx-4" />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Garage;
