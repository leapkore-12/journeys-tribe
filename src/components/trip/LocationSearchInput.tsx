import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Loader2, X, Hash, Search } from 'lucide-react';
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
  const [mode, setMode] = useState<'search' | 'coords'>('search');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const { results, isLoading, search, reverseGeocode, clearResults } = useMapboxGeocoding();
  const debouncedValue = useDebounce(value, 300);
  const debouncedLat = useDebounce(lat, 500);
  const debouncedLng = useDebounce(lng, 500);
  const displayResults = coordResults.length > 0 ? coordResults : results;
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const COORD_REGEX = /^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/;

  const isValidLat = (v: string) => { const n = parseFloat(v); return !isNaN(n) && n >= -90 && n <= 90; };
  const isValidLng = (v: string) => { const n = parseFloat(v); return !isNaN(n) && n >= -180 && n <= 180; };

  // Search by name mode
  useEffect(() => {
    if (mode !== 'search' || !debouncedValue || !isFocused) return;

    const coordMatch = debouncedValue.trim().match(COORD_REGEX);
    if (coordMatch) {
      const latVal = parseFloat(coordMatch[1]);
      const lngVal = parseFloat(coordMatch[2]);
      if (latVal >= -90 && latVal <= 90 && lngVal >= -180 && lngVal <= 180) {
        reverseGeocode([lngVal, latVal]).then((result) => {
          const syntheticResult: GeocodingResult = result
            ? { ...result, id: `coord-${latVal}-${lngVal}`, placeName: result.placeName, address: result.address }
            : { id: `coord-${latVal}-${lngVal}`, placeName: `${latVal}, ${lngVal}`, address: `Coordinates: ${latVal}, ${lngVal}`, coordinates: [lngVal, latVal] };
          setCoordResults([syntheticResult]);
          setShowDropdown(true);
        });
        return;
      }
    }

    setCoordResults([]);
    search(debouncedValue);
    setShowDropdown(true);
  }, [debouncedValue, search, isFocused, reverseGeocode, mode]);

  // Coordinate mode: reverse geocode when both are valid
  useEffect(() => {
    if (mode !== 'coords') return;
    if (!isValidLat(debouncedLat) || !isValidLng(debouncedLng)) {
      setCoordResults([]);
      setShowDropdown(false);
      return;
    }

    const latVal = parseFloat(debouncedLat);
    const lngVal = parseFloat(debouncedLng);

    reverseGeocode([lngVal, latVal]).then((result) => {
      const syntheticResult: GeocodingResult = result
        ? { ...result, id: `coord-${latVal}-${lngVal}` }
        : { id: `coord-${latVal}-${lngVal}`, placeName: `${latVal}, ${lngVal}`, address: `Coordinates: ${latVal}, ${lngVal}`, coordinates: [lngVal, latVal] };
      setCoordResults([syntheticResult]);
      setShowDropdown(true);
    });
  }, [debouncedLat, debouncedLng, mode, reverseGeocode]);

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
    setLat('');
    setLng('');
  };

  const handleClear = () => {
    onChange('');
    clearResults();
    setCoordResults([]);
    setLat('');
    setLng('');
  };

  const toggleMode = () => {
    setMode((m) => (m === 'search' ? 'coords' : 'search'));
    setShowDropdown(false);
    setCoordResults([]);
    clearResults();
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {mode === 'search' ? (
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
              if (inputRef.current) inputRef.current.select();
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
      ) : (
        <div className="flex gap-2">
          <Input
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Latitude"
            inputMode="decimal"
            className="h-12 bg-secondary border-0 text-foreground placeholder:text-muted-foreground flex-1"
          />
          <Input
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Longitude"
            inputMode="decimal"
            className="h-12 bg-secondary border-0 text-foreground placeholder:text-muted-foreground flex-1"
          />
          {(lat || lng) && (
            <button
              type="button"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground shrink-0 px-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Mode toggle */}
      <button
        type="button"
        onClick={toggleMode}
        className="flex items-center gap-1.5 mt-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
      >
        {mode === 'search' ? (
          <>
            <Hash className="h-3 w-3" />
            <span>Enter coordinates</span>
          </>
        ) : (
          <>
            <Search className="h-3 w-3" />
            <span>Search by name</span>
          </>
        )}
      </button>

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
