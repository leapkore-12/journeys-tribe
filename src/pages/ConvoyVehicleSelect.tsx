import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useVehicles } from "@/hooks/useVehicles";
import { useUpdateConvoyMemberVehicle } from "@/hooks/useConvoyMembers";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Car, Plus, Check, User } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const ConvoyVehicleSelect = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  const { data: vehicles, isLoading } = useVehicles(user?.id);
  const updateVehicle = useUpdateConvoyMemberVehicle();

  const handleSelectVehicle = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
  };

  const handleJoinConvoy = async (withVehicle: boolean) => {
    if (!tripId) return;

    setIsJoining(true);
    try {
      if (withVehicle && selectedVehicleId) {
        await updateVehicle.mutateAsync({
          tripId,
          vehicleId: selectedVehicleId,
        });
      }
      navigate(`/trip/active`);
    } catch (error) {
      console.error("Error updating convoy vehicle:", error);
      toast({
        title: "Error",
        description: "Failed to join convoy. Please try again.",
        variant: "destructive",
      });
      setIsJoining(false);
    }
  };

  const handleAddVehicle = () => {
    // Navigate to garage with return URL
    navigate(`/garage?returnTo=/convoy-vehicle-select/${tripId}`);
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center gap-3 border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/feed")}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold">Select Your Vehicle</h1>
          <p className="text-sm text-muted-foreground">
            Choose which vehicle you're riding for this convoy
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4 overflow-auto">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : vehicles && vehicles.length > 0 ? (
          <>
            <div className="space-y-3">
              {vehicles.map((vehicle, index) => {
                const isSelected = selectedVehicleId === vehicle.id;
                const primaryImage = vehicle.vehicle_images?.find(
                  (img) => img.is_primary
                )?.image_url || vehicle.vehicle_images?.[0]?.image_url;

                return (
                  <motion.div
                    key={vehicle.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card
                      className={`p-4 cursor-pointer transition-all ${
                        isSelected
                          ? "ring-2 ring-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => handleSelectVehicle(vehicle.id)}
                    >
                      <div className="flex items-center gap-4">
                        {primaryImage ? (
                          <img
                            src={primaryImage}
                            alt={vehicle.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                            <Car className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{vehicle.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {[vehicle.make, vehicle.model, vehicle.color]
                              .filter(Boolean)
                              .join(" • ")}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-5 w-5 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Add another vehicle */}
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleAddVehicle}
            >
              <Plus className="h-4 w-4" />
              Add Another Vehicle
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Car className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-2">No Vehicles in Garage</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add a vehicle to your garage or join as a passenger
            </p>
            <Button onClick={handleAddVehicle} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Vehicle
            </Button>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-border space-y-3 bg-background">
        {vehicles && vehicles.length > 0 && (
          <Button
            className="w-full"
            size="lg"
            disabled={!selectedVehicleId || isJoining}
            onClick={() => handleJoinConvoy(true)}
          >
            {isJoining ? "Joining..." : "Join Convoy"}
          </Button>
        )}
        <Button
          variant="ghost"
          className="w-full gap-2"
          disabled={isJoining}
          onClick={() => handleJoinConvoy(false)}
        >
          <User className="h-4 w-4" />
          Join as Passenger (No Vehicle)
        </Button>
      </div>
    </div>
  );
};

export default ConvoyVehicleSelect;
