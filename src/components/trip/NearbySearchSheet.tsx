import { useState } from 'react';
import { Search, Fuel, Utensils, Hospital, Coffee, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMapboxGeocoding } from '@/hooks/useMapboxGeocoding';
import { Loader2 } from 'lucide-react';

interface NearbySearchSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userPosition: [number, number] | null;
  onSelectPlace?: (place: { name: string; coordinates: [number, number] }) => void;
}

const categories = [
  { id: 'gas_station', label: 'Gas Station', icon: Fuel, query: 'gas station fuel' },
  { id: 'restaurant', label: 'Restaurant', icon: Utensils, query: 'restaurant food' },
  { id: 'hospital', label: 'Hospital', icon: Hospital, query: 'hospital emergency' },
  { id: 'cafe', label: 'Rest Stop', icon: Coffee, query: 'cafe rest stop' },
];

const NearbySearchSheet = ({ open, onOpenChange, userPosition, onSelectPlace }: NearbySearchSheetProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { results, isLoading, search, clearResults } = useMapboxGeocoding();

  const handleCategorySearch = (query: string) => {
    if (!userPosition) return;
    search(query, userPosition);
  };

  const handleCustomSearch = () => {
    if (!searchQuery.trim() || !userPosition) return;
    search(searchQuery, userPosition);
  };

  const handleSelectPlace = (result: { placeName: string; coordinates: [number, number] }) => {
    onSelectPlace?.({ name: result.placeName, coordinates: result.coordinates });
    onOpenChange(false);
    clearResults();
    setSearchQuery('');
  };

  const calculateDistance = (coords: [number, number]): string => {
    if (!userPosition) return '';
    const R = 6371;
    const dLat = (coords[1] - userPosition[1]) * Math.PI / 180;
    const dLon = (coords[0] - userPosition[0]) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(userPosition[1] * Math.PI / 180) * Math.cos(coords[1] * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;
    return d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-primary">Search Nearby</SheetTitle>
        </SheetHeader>

        {/* Search Input */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for a place..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCustomSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleCustomSearch} disabled={isLoading || !searchQuery.trim()}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
          </Button>
        </div>

        {/* Category Buttons */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant="outline"
              className="flex flex-col h-auto py-3 gap-1"
              onClick={() => handleCategorySearch(cat.query)}
              disabled={isLoading || !userPosition}
            >
              <cat.icon className="h-5 w-5" />
              <span className="text-xs">{cat.label}</span>
            </Button>
          ))}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          
          {!isLoading && results.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              {userPosition ? 'Search or select a category above' : 'Waiting for GPS location...'}
            </p>
          )}

          {results.map((result) => (
            <button
              key={result.id}
              onClick={() => handleSelectPlace(result)}
              className="w-full p-3 text-left bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{result.placeName.split(',')[0]}</p>
                  <p className="text-sm text-muted-foreground truncate">{result.address || result.placeName}</p>
                </div>
                <span className="text-sm text-primary ml-2 whitespace-nowrap">
                  {calculateDistance(result.coordinates)}
                </span>
              </div>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NearbySearchSheet;
