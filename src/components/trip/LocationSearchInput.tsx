import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useMapboxGeocoding, GeocodingResult } from '@/hooks/useMapboxGeocoding';
import { useDebounce } from '@/hooks/useDebounce';

interface LocationSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: GeocodingResult) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
}

const LocationSearchInput = ({
  value,
  onChange,
  onSelect,
  placeholder = 'Search location...',
  icon,
  className = '',
}: LocationSearchInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [coordResults, setCoordResults] = useState<GeocodingResult[]>([]);
  const { results, isLoading, search, reverseGeocode, clearResults } = useMapboxGeocoding();
  const debouncedValue = useDebounce(value, 300);
  const displayResults = coordResults.length > 0 ? coordResults : results;
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const COORD_REGEX = /^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/;

  // Search when debounced value changes
  useEffect(() => {
    if (!debouncedValue || !isFocused) return;

    const coordMatch = debouncedValue.trim().match(COORD_REGEX);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        // Reverse geocode the coordinates
        reverseGeocode([lng, lat]).then((result) => {
          const syntheticResult: GeocodingResult = result
            ? { ...result, id: `coord-${lat}-${lng}`, placeName: result.placeName, address: result.address }
            : { id: `coord-${lat}-${lng}`, placeName: `${lat}, ${lng}`, address: `Coordinates: ${lat}, ${lng}`, coordinates: [lng, lat] };
          setCoordResults([syntheticResult]);
          setShowDropdown(true);
        });
        return;
      }
    }

    setCoordResults([]);
    search(debouncedValue);
    setShowDropdown(true);
  }, [debouncedValue, search, isFocused, reverseGeocode]);

  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (result: GeocodingResult) => {
    onChange(result.address);
    onSelect(result);
    setShowDropdown(false);
    setCoordResults([]);
    clearResults();
  };

  const handleClear = () => {
    onChange('');
    clearResults();
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        )}
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            // Select all text on focus so typing replaces it
            if (inputRef.current) {
              inputRef.current.select();
            }
            if (displayResults.length > 0) setShowDropdown(true);
          }}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={`h-12 bg-secondary border-0 text-foreground placeholder:text-muted-foreground ${
            icon ? 'pl-11' : ''
          } ${value ? 'pr-10' : ''}`}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
        {value && !isLoading && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showDropdown && displayResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-1 bg-secondary rounded-lg border border-border overflow-hidden z-50 shadow-lg"
          >
            {displayResults.map((result) => (
              <button
                key={result.id}
                type="button"
                onClick={() => handleSelect(result)}
                className="w-full px-4 py-3 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left"
              >
                <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-foreground font-medium truncate">{result.placeName}</p>
                  <p className="text-sm text-muted-foreground truncate">{result.address}</p>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LocationSearchInput;
