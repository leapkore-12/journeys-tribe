import { useState } from 'react';
import { AlertTriangle, Construction, Car, Cloud, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface ReportHazardSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userPosition: [number, number] | null;
  tripId: string | null;
}

const hazardTypes = [
  { id: 'pothole', label: 'Pothole', icon: Construction },
  { id: 'accident', label: 'Accident', icon: Car },
  { id: 'debris', label: 'Debris', icon: AlertTriangle },
  { id: 'weather', label: 'Weather', icon: Cloud },
];

const ReportHazardSheet = ({ open, onOpenChange, userPosition, tripId }: ReportHazardSheetProps) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!selectedType || !userPosition || !user) {
      toast({
        title: 'Unable to report',
        description: 'Please select a hazard type and ensure GPS is available.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('road_hazards').insert({
        trip_id: tripId,
        reporter_id: user.id,
        hazard_type: selectedType,
        latitude: userPosition[1],
        longitude: userPosition[0],
        description: description.trim() || null,
      });

      if (error) throw error;

      toast({
        title: 'Hazard reported',
        description: 'Thank you for helping keep the road safe!',
      });
      
      onOpenChange(false);
      setSelectedType(null);
      setDescription('');
    } catch (error) {
      console.error('Error reporting hazard:', error);
      toast({
        title: 'Failed to report',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-primary">Report Road Hazard</SheetTitle>
        </SheetHeader>

        {!userPosition ? (
          <p className="text-center text-muted-foreground py-8">
            Waiting for GPS location...
          </p>
        ) : (
          <div className="space-y-4 pb-4">
            {/* Hazard Type Selection */}
            <div className="grid grid-cols-4 gap-2">
              {hazardTypes.map((type) => (
                <Button
                  key={type.id}
                  variant={selectedType === type.id ? 'default' : 'outline'}
                  className="flex flex-col h-auto py-4 gap-2"
                  onClick={() => setSelectedType(type.id)}
                >
                  <type.icon className="h-6 w-6" />
                  <span className="text-xs">{type.label}</span>
                </Button>
              ))}
            </div>

            {/* Description */}
            <Textarea
              placeholder="Add details (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />

            {/* Location Info */}
            <p className="text-xs text-muted-foreground text-center">
              📍 Reporting at your current location
            </p>

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={!selectedType || isSubmitting}
              className="w-full h-12"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reporting...
                </>
              ) : (
                'Report Hazard'
              )}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default ReportHazardSheet;
